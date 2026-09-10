from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.translation import TextTranslationRequest, TextTranslationResponse, AudioTranslationRequest, AudioTranslationResponse
from app.services.translation import TranslationService
from app.services.speech import SpeechToTextService
from app.api.deps import get_current_user
from app.services.memory_service import save_translation_memory_direct
from app.models.domain import User
import uuid

router = APIRouter()
translation_service = TranslationService()
speech_service = SpeechToTextService()

@router.post("/text", response_model=TextTranslationResponse)
async def translate_text_endpoint(
    request: TextTranslationRequest,
    current_user: User = Depends(get_current_user)
):
    """Translate raw text from a source language to a target language."""
    # We do not have a db session here natively but we can get one
    db_gen = get_db()
    db = next(db_gen)
    try:
        translated, src = await translation_service.translate_text(
            text=request.text,
            source_lang=request.source_language,
            target_lang=request.target_language,
            user_id=current_user.id,
            db=db
        )
    finally:
        db_gen.close()
    
    return TextTranslationResponse(
        source_language=request.source_language,
        target_language=request.target_language,
        source_text=request.text,
        translated_text=translated,
        translation_source=src
    )

@router.post("/audio", response_model=AudioTranslationResponse)
async def translate_audio_endpoint(
    request: AudioTranslationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """End-to-end pipeline: Audio -> STT -> Transcript -> Translation."""
    # Check file ownership
    from app.models.domain import File as FileModel
    file = db.query(FileModel).filter(FileModel.id == request.file_id).first()
    if not file or not file.project or file.project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="File not found or access denied")

    # 1. Speech-to-Text
    stt_response = await speech_service.transcribe_audio(
        file_id=request.file_id,
        source_language=request.source_language,
        db=db
    )
    
    # 2. Text Translation
    translated_text, src = await translation_service.translate_text(
        text=stt_response.transcript,
        source_lang=request.source_language,
        target_lang=request.target_language,
        user_id=current_user.id,
        db=db
    )
    
    return AudioTranslationResponse(
        job_id=uuid.uuid4(),
        status="COMPLETED",
        transcript=stt_response.transcript,
        translated_text=translated_text,
        translation_source=src
    )
