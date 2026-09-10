from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.domain import User, TranslationMemory, Project
from app.schemas.memory import MemoryCreate, MemoryResponse, PaginatedMemoryResponse
from typing import Optional
import uuid

router = APIRouter()

@router.post("/", response_model=MemoryResponse, status_code=201)
async def create_memory(
    request: MemoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if request.project_id:
        project = db.query(Project).filter(Project.id == request.project_id, Project.user_id == current_user.id).first()
        if not project:
            raise HTTPException(status_code=403, detail="Project not found or access denied")

    memory = TranslationMemory(
        user_id=current_user.id,
        source_language=request.source_language,
        target_language=request.target_language,
        source_text=request.source_text,
        target_text=request.target_text,
        project_id=request.project_id
    )
    db.add(memory)
    db.commit()
    db.refresh(memory)
    
    return memory

@router.get("/", response_model=PaginatedMemoryResponse)
async def list_memories(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    source_language: Optional[str] = Query(None),
    target_language: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    project_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(TranslationMemory).filter(TranslationMemory.user_id == current_user.id)
    
    if source_language:
        query = query.filter(TranslationMemory.source_language == source_language)
    if target_language:
        query = query.filter(TranslationMemory.target_language == target_language)
    if project_id:
        query = query.filter(TranslationMemory.project_id == project_id)
    if search:
        query = query.filter(TranslationMemory.source_text.ilike(f"%{search}%"))
        
    total = query.count()
    items = query.order_by(desc(TranslationMemory.created_at)).offset((page - 1) * size).limit(size).all()
    
    return PaginatedMemoryResponse(
        items=items,
        total=total,
        page=page,
        size=size
    )

@router.delete("/{memory_id}", status_code=204)
async def delete_memory(
    memory_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    memory = db.query(TranslationMemory).filter(
        TranslationMemory.id == memory_id, 
        TranslationMemory.user_id == current_user.id
    ).first()
    
    if not memory:
        raise HTTPException(status_code=404, detail="Translation memory not found")
        
    db.delete(memory)
    db.commit()
    return None
