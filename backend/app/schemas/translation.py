from pydantic import BaseModel, Field

import uuid

class TextTranslationRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    source_language: str = Field(..., min_length=2, max_length=10)
    target_language: str = Field(..., min_length=2, max_length=10)
    glossary_id: uuid.UUID | None = None
    project_id: uuid.UUID | None = None

class TextTranslationResponse(BaseModel):
    source_language: str
    target_language: str
    source_text: str
    translated_text: str
    translation_source: str | None = None

class AudioTranslationRequest(BaseModel):
    file_id: uuid.UUID
    source_language: str
    target_language: str
    project_id: uuid.UUID | None = None

class AudioTranslationResponse(BaseModel):
    job_id: uuid.UUID
    status: str
    transcript: str
    translated_text: str
    translation_source: str | None = None
