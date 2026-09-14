from pydantic import BaseModel
import uuid
from typing import Optional
from app.models.domain import JobStatus
from datetime import datetime

class JobCreateRequest(BaseModel):
    file_id: uuid.UUID
    source_language: str
    target_language: str
    glossary_id: Optional[uuid.UUID] = None
    project_id: Optional[uuid.UUID] = None
    team_id: Optional[uuid.UUID] = None

class JobResponse(BaseModel):
    id: uuid.UUID
    status: JobStatus
    progress: int
    error_message: Optional[str] = None
    created_at: datetime
    
    # Attached results if completed
    original_transcript: Optional[str] = None
    result_text: Optional[str] = None
    result_audio_url: Optional[str] = None
    result_video_url: Optional[str] = None
    result_image_url: Optional[str] = None
    result_pdf_url: Optional[str] = None
    result_document_url: Optional[str] = None
    subtitles_srt_url: Optional[str] = None
    subtitles_vtt_url: Optional[str] = None
    translation_source: Optional[str] = None

class JobHistoryResponse(BaseModel):
    id: uuid.UUID
    status: JobStatus
    source_language: str
    target_language: str
    created_at: datetime
    updated_at: datetime
    filename: str
    mime_type: str
    size: int
    processing_time_seconds: Optional[int] = None
    
    class Config:
        from_attributes = True

class PaginatedJobResponse(BaseModel):
    items: list[JobHistoryResponse]
    total: int
    page: int
    size: int
