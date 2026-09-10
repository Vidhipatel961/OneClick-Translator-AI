import uuid
from sqlalchemy.orm import Session
from app.models.domain import TranslationJob, TranslationMemory
from app.core.logging import logger

def save_translation_memory_direct(db: Session, user_id: uuid.UUID, source_lang: str, target_lang: str, source_text: str, target_text: str, project_id: uuid.UUID = None):
    if not source_text or not target_text:
        return
        
    source_text = source_text.strip()
    target_text = target_text.strip()
    
    if not source_text or not target_text:
        return
        
    try:
        # Avoid exact duplicate entries
        existing = db.query(TranslationMemory).filter(
            TranslationMemory.user_id == user_id,
            TranslationMemory.source_language == source_lang,
            TranslationMemory.target_language == target_lang,
            TranslationMemory.source_text == source_text,
            TranslationMemory.target_text == target_text
        ).first()
        
        if existing:
            return
            
        memory = TranslationMemory(
            user_id=user_id,
            project_id=project_id,
            source_language=source_lang,
            target_language=target_lang,
            source_text=source_text,
            target_text=target_text
        )
        db.add(memory)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to auto-save TranslationMemory: {e}")
        db.rollback()

def save_translation_memory(db: Session, job_id: uuid.UUID, source_text: str, target_text: str):
    """
    Saves a successful translation to the TranslationMemory table.
    Looks up job to get user/lang details.
    """
    try:
        job = db.query(TranslationJob).filter(TranslationJob.id == job_id).first()
        if not job:
            return
            
        save_translation_memory_direct(
            db=db,
            user_id=job.user_id,
            source_lang=job.source_language,
            target_lang=job.target_language,
            source_text=source_text,
            target_text=target_text,
            project_id=job.project_id
        )
    except Exception as e:
        logger.error(f"Failed to auto-save TranslationMemory for job {job_id}: {e}")
