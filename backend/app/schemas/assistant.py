from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime

class AIMessageBase(BaseModel):
    role: str
    content: str
    
class AIMessageResponse(AIMessageBase):
    id: uuid.UUID
    
    class Config:
        from_attributes = True

class AIConversationResponse(BaseModel):
    id: uuid.UUID
    job_id: Optional[uuid.UUID]
    title: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class AIChatRequest(BaseModel):
    conversation_id: Optional[uuid.UUID] = None
    job_id: Optional[uuid.UUID] = None
    query: str
    
class AIChatResponse(BaseModel):
    conversation_id: uuid.UUID
    message: str
