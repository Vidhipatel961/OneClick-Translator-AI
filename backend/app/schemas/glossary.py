from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime

class GlossaryTermBase(BaseModel):
    source_term: str
    target_term: str
    source_language: str
    target_language: str

class GlossaryTermCreate(GlossaryTermBase):
    pass

class GlossaryTermUpdate(GlossaryTermBase):
    pass

class GlossaryTermResponse(GlossaryTermBase):
    id: uuid.UUID
    glossary_id: uuid.UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

class GlossaryBase(BaseModel):
    name: str
    description: Optional[str] = None

class GlossaryCreate(GlossaryBase):
    pass

class GlossaryUpdate(GlossaryBase):
    pass

class GlossaryResponse(GlossaryBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    terms: List[GlossaryTermResponse] = []
    
    class Config:
        from_attributes = True
