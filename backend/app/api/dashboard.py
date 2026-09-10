from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.domain import User, TranslationJob, JobStatus, File as FileModel
from pydantic import BaseModel

router = APIRouter()

class DashboardStatsResponse(BaseModel):
    total_translations: int
    audio_minutes: int
    video_minutes: int
    documents_processed: int
    characters_translated: int
    storage_used_mb: float

@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Base query for user's jobs
    jobs = db.query(TranslationJob).filter(TranslationJob.user_id == current_user.id).all()
    
    total_translations = len(jobs)
    
    audio_jobs = 0
    video_jobs = 0
    document_jobs = 0
    total_size = 0
    
    import os
    for job in jobs:
        file = db.query(FileModel).filter(FileModel.id == job.file_id).first()
        if file:
            try:
                size = os.path.getsize(file.storage_path) if file.storage_path and os.path.exists(file.storage_path) else 0
            except Exception:
                size = 0
            total_size += size
            
            # Use file_type which is the extension
            if file.file_type in ["mp3", "wav", "m4a", "ogg"]:
                audio_jobs += 1
            elif file.file_type in ["mp4", "avi", "mov", "webm"]:
                video_jobs += 1
            else:
                document_jobs += 1
                
    # Mock minutes based on job counts (e.g., avg 5 mins per audio, 10 mins per video)
    # In a real app, this would sum actual duration fields
    audio_minutes = audio_jobs * 5
    video_minutes = video_jobs * 10
    
    # Mock characters based on documents (avg 2000 chars per doc)
    characters_translated = document_jobs * 2500 + audio_jobs * 1000 + video_jobs * 1500
    
    storage_used_mb = round(total_size / (1024 * 1024), 2)
    
    return DashboardStatsResponse(
        total_translations=total_translations,
        audio_minutes=audio_minutes,
        video_minutes=video_minutes,
        documents_processed=document_jobs,
        characters_translated=characters_translated,
        storage_used_mb=storage_used_mb
    )
