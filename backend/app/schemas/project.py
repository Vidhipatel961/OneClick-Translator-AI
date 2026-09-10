from pydantic import BaseModel, constr
from typing import Optional
from datetime import datetime
import uuid

class ProjectBase(BaseModel):
    name: constr(min_length=1, max_length=255)
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
