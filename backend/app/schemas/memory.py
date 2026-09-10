from pydantic import BaseModel, Field
import uuid
from typing import Optional, List
from datetime import datetime

class MemoryCreate(BaseModel):
    source_language: str = Field(..., min_length=2, max_length=10)
    target_language: str = Field(..., min_length=2, max_length=10)
    source_text: str = Field(..., min_length=1)
    target_text: str = Field(..., min_length=1)
    project_id: Optional[uuid.UUID] = None

class MemoryResponse(BaseModel):
    id: uuid.UUID
    source_language: str
    target_language: str
    source_text: str
    target_text: str
    project_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PaginatedMemoryResponse(BaseModel):
    items: List[MemoryResponse]
    total: int
    page: int
    size: int
