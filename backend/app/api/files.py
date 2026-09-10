from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import os
import uuid
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.domain import User, File as FileModel
from app.schemas.file import FileUploadResponse
from app.services.file_service import FileStorageService

router = APIRouter()
file_service = FileStorageService()

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a file (audio, video, document, or image) to Lingora AI."""
    return await file_service.upload_audio_file(file, db, user_id=current_user.id)

@router.get("/{file_id}/download")
async def download_file(
    file_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_file = db.query(FileModel).filter(FileModel.id == file_id, FileModel.project.has(user_id=current_user.id)).first()
    # Or more directly if FileModel has user_id, wait, FileModel belongs to Project, Project belongs to User.
    # Let's check FileModel. 
    # Actually, the user can upload files without a project? The file_service mocks project_id if not present.
    # Let's just check through project relationship.
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found or unauthorized")
        
    if not os.path.exists(db_file.storage_path):
        raise HTTPException(status_code=404, detail="File content missing")
        
    import mimetypes
    media_type, _ = mimetypes.guess_type(db_file.filename)
    if not media_type:
        if db_file.file_type == "mp3":
            media_type = "audio/mpeg"
        elif db_file.file_type == "mp4":
            media_type = "video/mp4"
        else:
            media_type = "application/octet-stream"
            
    return FileResponse(db_file.storage_path, filename=db_file.filename, media_type=media_type)
