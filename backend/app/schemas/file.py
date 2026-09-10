from pydantic import BaseModel
import uuid
from typing import Optional

class FileUploadResponse(BaseModel):
    file_id: uuid.UUID
    filename: str
    mime_type: str
    size: int
    duration: Optional[float] = None
    status: str
