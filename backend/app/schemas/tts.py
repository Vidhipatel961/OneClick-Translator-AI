from pydantic import BaseModel, Field
import uuid

class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    language: str = Field(..., min_length=2, max_length=10)
    voice: str = Field(default="default")

class TTSResponse(BaseModel):
    file_id: uuid.UUID
    audio_url: str
