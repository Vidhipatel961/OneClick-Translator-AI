from pydantic import BaseModel
from typing import List, Optional
import uuid

class TranscriptionSegment(BaseModel):
    start: float
    end: float
    text: str

class TranscriptionRequest(BaseModel):
    file_id: uuid.UUID
    source_language: str

class TranscriptionResponse(BaseModel):
    transcript: str
    detected_language: str
    duration: float
    segments: List[TranscriptionSegment]
