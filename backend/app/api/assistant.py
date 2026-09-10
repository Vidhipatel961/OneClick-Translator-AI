from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.domain import User, TranslationJob, AIConversation, AIMessage, UsageRecord
from app.schemas.assistant import AIChatRequest, AIChatResponse, AIConversationResponse, AIMessageResponse
from app.services.assistant_service import AssistantService
import uuid
from app.core.limits import SUBSCRIPTION_LIMITS

router = APIRouter()
assistant_service = AssistantService()

@router.get("/conversations", response_model=list[AIConversationResponse])
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(AIConversation).filter(AIConversation.user_id == current_user.id).order_by(AIConversation.created_at.desc()).all()

@router.get("/conversations/{conversation_id}/messages", response_model=list[AIMessageResponse])
async def get_messages(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(AIConversation).filter(AIConversation.id == conversation_id, AIConversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return db.query(AIMessage).filter(AIMessage.conversation_id == conversation_id).order_by(AIMessage.created_at.asc()).all()

@router.post("/chat", response_model=AIChatResponse)
async def chat(
    request: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = None
    if request.conversation_id:
        conv = db.query(AIConversation).filter(AIConversation.id == request.conversation_id, AIConversation.user_id == current_user.id).first()
    
    if not conv:
        title = request.query[:50] + "..." if len(request.query) > 50 else request.query
        conv = AIConversation(
            user_id=current_user.id,
            job_id=request.job_id,
            title=title
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
        
    # Check limits
    usage = db.query(UsageRecord).filter(UsageRecord.user_id == current_user.id).first()
    if not usage:
        usage = UsageRecord(user_id=current_user.id)
        db.add(usage)
    
    tier = current_user.subscription_tier or "FREE"
    limits = SUBSCRIPTION_LIMITS.get(tier, SUBSCRIPTION_LIMITS["FREE"])
    if usage.ai_requests >= limits["ai_requests"]:
        raise HTTPException(status_code=403, detail=f"AI request limit reached for {tier} plan.")
    
    # Save user message
    user_msg = AIMessage(
        conversation_id=conv.id,
        role="user",
        content=request.query
    )
    db.add(user_msg)
    usage.ai_requests += 1
    db.commit()
    
    # Get document context if job is attached
    context_text = ""
    if conv.job_id:
        job = db.query(TranslationJob).filter(TranslationJob.id == conv.job_id, TranslationJob.user_id == current_user.id).first()
        if job and job.result:
            # Combine original and translated
            context_text = f"Original Document:\n{job.result.original_transcript}\n\nTranslated Document:\n{job.result.result_text}"
            
    # Process with RAG
    chunks = assistant_service.chunk_text(context_text)
    relevant_chunks = assistant_service.retrieve_relevant_chunks(request.query, chunks)
    
    # Get history
    history_db = db.query(AIMessage).filter(AIMessage.conversation_id == conv.id).order_by(AIMessage.created_at.asc()).all()
    history = [{"role": msg.role, "content": msg.content} for msg in history_db[:-1]] # exclude the one we just added
    
    # Generate AI response
    try:
        ai_response_text = await assistant_service.generate_response(request.query, relevant_chunks, history)
    except Exception as e:
        ai_response_text = f"Sorry, I encountered an error communicating with the AI service: {str(e)}"
        
    # Save AI message
    ai_msg = AIMessage(
        conversation_id=conv.id,
        role="assistant",
        content=ai_response_text
    )
    db.add(ai_msg)
    db.commit()
    
    return AIChatResponse(
        conversation_id=conv.id,
        message=ai_response_text
    )
