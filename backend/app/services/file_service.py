import uuid
import re
import os
from fastapi import UploadFile
from app.services.storage.base import StorageProvider
from app.services.storage.local_provider import LocalStorageProvider
from app.core.exceptions import BaseLingoraException
from app.core.logging import logger
from sqlalchemy.orm import Session
from app.models.domain import File as FileModel, UsageRecord
from app.schemas.file import FileUploadResponse
from app.core.limits import SUBSCRIPTION_LIMITS
from fastapi import HTTPException

# All supported file types grouped by category
ALLOWED_EXTENSIONS = {
    # Audio
    '.mp3', '.wav', '.m4a',
    # Video
    '.mp4', '.webm', '.mov', '.avi', '.mkv',
    # Documents
    '.pdf', '.docx', '.doc', '.pptx', '.ppt', '.txt',
    # Images
    '.png', '.jpg', '.jpeg', '.webp',
}

ALLOWED_MIME_TYPES = {
    # Audio
    'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4',
    'audio/m4a', 'audio/x-m4a', 'audio/ogg', 'audio/webm',
    # Video
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
    'video/x-matroska', 'video/mpeg', 'video/ogg', 'video/3gpp',
    # Documents
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'text/plain',
    # Images
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    # Fallback — some browsers send generic MIME for video
    'application/octet-stream',
}

# 500 MB max to accommodate large video files
MAX_FILE_SIZE = 500 * 1024 * 1024


class FileStorageService:
    def __init__(self, provider: StorageProvider = None):
        self.provider = provider or LocalStorageProvider()

    def sanitize_filename(self, filename: str) -> str:
        clean_name = re.sub(r'[^a-zA-Z0-9.\-_]', '_', filename)
        return clean_name

    async def upload_audio_file(
        self,
        file: UploadFile,
        db: Session,
        user_id: uuid.UUID = None,
        project_id: uuid.UUID = None,
    ) -> FileUploadResponse:
        """Upload any supported file (audio, video, document, image)."""

        # 1. Validate extension
        ext = os.path.splitext(file.filename or '')[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise BaseLingoraException(
                f"Invalid file extension '{ext}'. "
                f"Allowed: {sorted(ALLOWED_EXTENSIONS)}",
                400,
            )

        # 2. Validate MIME type — allow if either the extension or MIME is valid
        #    (browsers sometimes send wrong MIME for video files)
        content_type = (file.content_type or '').split(';')[0].strip().lower()
        if content_type not in ALLOWED_MIME_TYPES:
            logger.warning(
                f"Unexpected MIME type '{content_type}' for extension '{ext}', "
                f"allowing because extension is valid."
            )
            # Only hard-reject if MIME looks clearly wrong (e.g. text/html)
            if content_type.startswith('text/html') or content_type.startswith('application/x-'):
                raise BaseLingoraException(
                    f"Invalid MIME type: {content_type}", 400
                )

        # 3. Read and validate size
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)

        if size > MAX_FILE_SIZE:
            raise BaseLingoraException(
                f"File too large. Max size is {MAX_FILE_SIZE // (1024 * 1024)} MB",
                400,
            )

        # 4. Storage quota check
        if user_id:
            from app.models.domain import User
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                usage = db.query(UsageRecord).filter(
                    UsageRecord.user_id == user_id
                ).first()
                if not usage:
                    usage = UsageRecord(user_id=user_id)
                    db.add(usage)
                    db.commit()

                tier = user.subscription_tier or "FREE"
                limits = SUBSCRIPTION_LIMITS.get(tier, SUBSCRIPTION_LIMITS["FREE"])
                if usage.storage_bytes + size > limits["storage_bytes"]:
                    raise HTTPException(
                        status_code=403,
                        detail=f"Storage limit exceeded for {tier} plan.",
                    )
                usage.storage_bytes += size
                db.commit()

        # 5. Generate ID and sanitize filename
        file_id = uuid.uuid4()
        clean_name = self.sanitize_filename(file.filename or f"file{ext}")

        # 6. Store file on disk
        logger.info(
            f"Saving file {clean_name} ({size} bytes) "
            f"via {self.provider.__class__.__name__}"
        )
        storage_path = await self.provider.save_file(file_id, clean_name, file.file)

        # 7. Save metadata to DB (ensure a default project exists for the user)
        from app.models.domain import Project

        if not project_id and user_id:
            project = db.query(Project).filter(
                Project.user_id == user_id, Project.name == "Default"
            ).first()
            if not project:
                project = Project(name="Default", user_id=user_id)
                db.add(project)
                db.commit()
                db.refresh(project)
            project_id = project.id

        if project_id:
            db_file = FileModel(
                id=file_id,
                filename=clean_name,
                file_type=ext.replace(".", ""),
                storage_path=storage_path,
                project_id=project_id,
            )
            db.add(db_file)
            db.commit()

        return FileUploadResponse(
            file_id=file_id,
            filename=clean_name,
            mime_type=content_type or f"application/{ext.lstrip('.')}",
            size=size,
            duration=None,
            status="UPLOADED",
        )
