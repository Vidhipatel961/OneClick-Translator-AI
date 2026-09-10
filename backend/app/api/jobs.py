from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.domain import User, TranslationJob, JobStatus, TranslationResult, File as FileModel, UsageRecord, Project
from app.schemas.job import JobCreateRequest, JobResponse, PaginatedJobResponse, JobHistoryResponse
from app.core.limits import SUBSCRIPTION_LIMITS
import uuid
import os

# Map file_type (extension without dot) to MIME type
_MIME_MAP = {
    "mp3": "audio/mpeg",
    "wav": "audio/wav",
    "m4a": "audio/mp4",
    "mp4": "video/mp4",
    "avi": "video/x-msvideo",
    "mov": "video/quicktime",
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "doc": "application/msword",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "txt": "text/plain",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "webp": "image/webp",
}

router = APIRouter()

@router.post("/audio-translation", response_model=JobResponse)
async def create_audio_translation_job(
    request: JobCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if request.source_language == "auto":
        raise HTTPException(
            status_code=400, 
            detail="Auto-detect is not supported for Audio/Video files because speech recognition models must know the language beforehand to avoid hallucinating words. Please explicitly select the correct Translate From language."
        )

    usage = db.query(UsageRecord).filter(UsageRecord.user_id == current_user.id).first()
    tier = current_user.subscription_tier or "FREE"
    limits = SUBSCRIPTION_LIMITS.get(tier, SUBSCRIPTION_LIMITS["FREE"])
    if usage and usage.audio_seconds >= limits["audio_seconds"]:
        raise HTTPException(status_code=403, detail=f"Audio processing limit reached for {tier} plan.")

    if request.project_id:
        project = db.query(Project).filter(Project.id == request.project_id, Project.user_id == current_user.id).first()
        if not project:
            raise HTTPException(status_code=403, detail="Project not found or access denied")

    # Check file ownership
    file = db.query(FileModel).filter(FileModel.id == request.file_id).first()
    if not file or not file.project or file.project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="File not found or access denied")

    # 1. Create Job in DB
    job = TranslationJob(
        user_id=current_user.id,
        file_id=request.file_id,
        source_language=request.source_language,
        target_language=request.target_language,
        status=JobStatus.PENDING,
        progress=0,
        project_id=request.project_id
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # 2. Queue Celery Task — fall back to background thread if broker is unavailable
    try:
        from app.tasks.audio_tasks import process_audio_translation
        process_audio_translation.delay(
            str(job.id),
            str(request.file_id),
            request.source_language,
            request.target_language,
            str(current_user.id),
            str(request.glossary_id) if request.glossary_id else None
        )
    except Exception as e:
        import logging
        import threading
        logging.warning(f"Celery broker unavailable ({str(e)}), running pipeline in background thread.")

        # Capture values for the thread closure
        _job_id = job.id
        _file_id = request.file_id
        _src = request.source_language
        _tgt = request.target_language
        _uid = current_user.id
        _gid = str(request.glossary_id) if request.glossary_id else None

        def _run_pipeline():
            import asyncio
            from app.tasks.audio_tasks import run_audio_pipeline_async
            asyncio.run(run_audio_pipeline_async(
                _job_id, _file_id, _src, _tgt, _uid, _gid
            ))

        threading.Thread(target=_run_pipeline, daemon=True).start()

    return JobResponse(
        id=job.id,
        status=job.status,
        progress=job.progress,
        created_at=job.created_at
    )


@router.post("/video-translation", response_model=JobResponse)
async def create_video_translation_job(
    request: JobCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if request.source_language == "auto":
        raise HTTPException(
            status_code=400, 
            detail="Auto-detect is not supported for Audio/Video files because speech recognition models must know the language beforehand to avoid hallucinating words. Please explicitly select the correct Translate From language."
        )

    if request.project_id:
        project = db.query(Project).filter(Project.id == request.project_id, Project.user_id == current_user.id).first()
        if not project:
            raise HTTPException(status_code=403, detail="Project not found or access denied")

    # Check file ownership
    file = db.query(FileModel).filter(FileModel.id == request.file_id).first()
    if not file or not file.project or file.project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="File not found or access denied")

    job = TranslationJob(
        user_id=current_user.id,
        file_id=request.file_id,
        source_language=request.source_language,
        target_language=request.target_language,
        status=JobStatus.PENDING,
        progress=0,
        project_id=request.project_id
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        from app.tasks.video_tasks import process_video_translation
        process_video_translation.delay(
            str(job.id),
            str(request.file_id),
            request.source_language,
            request.target_language,
            str(current_user.id),
            str(request.glossary_id) if request.glossary_id else None
        )
    except Exception as e:
        import logging
        import threading
        logging.warning(f"Celery broker unavailable ({str(e)}), running pipeline in background thread.")

        # Capture values for the thread closure
        _job_id = job.id
        _file_id = request.file_id
        _src = request.source_language
        _tgt = request.target_language
        _uid = current_user.id
        _gid = str(request.glossary_id) if request.glossary_id else None

        def _run_pipeline():
            import asyncio
            from app.tasks.video_tasks import run_video_pipeline_async
            asyncio.run(run_video_pipeline_async(
                _job_id, _file_id, _src, _tgt, _uid, _gid
            ))

        threading.Thread(target=_run_pipeline, daemon=True).start()

    return JobResponse(
        id=job.id,
        status=job.status,
        progress=job.progress,
        created_at=job.created_at
    )


@router.post("/document-translation", response_model=JobResponse)
async def create_document_translation_job(
    request: JobCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    usage = db.query(UsageRecord).filter(UsageRecord.user_id == current_user.id).first()
    tier = current_user.subscription_tier or "FREE"
    limits = SUBSCRIPTION_LIMITS.get(tier, SUBSCRIPTION_LIMITS["FREE"])
    if usage and usage.documents_processed >= limits["documents_processed"]:
        raise HTTPException(status_code=403, detail=f"Document processing limit reached for {tier} plan.")

    if request.project_id:
        project = db.query(Project).filter(Project.id == request.project_id, Project.user_id == current_user.id).first()
        if not project:
            raise HTTPException(status_code=403, detail="Project not found or access denied")

    # Check file ownership
    file = db.query(FileModel).filter(FileModel.id == request.file_id).first()
    if not file or not file.project or file.project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="File not found or access denied")

    job = TranslationJob(
        user_id=current_user.id,
        file_id=request.file_id,
        source_language=request.source_language,
        target_language=request.target_language,
        status=JobStatus.PENDING,
        progress=0,
        project_id=request.project_id
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        from app.tasks.document_tasks import process_document_translation
        process_document_translation.delay(
            str(job.id),
            str(request.file_id),
            request.source_language,
            request.target_language,
            str(current_user.id),
            str(request.glossary_id) if request.glossary_id else None
        )
    except Exception as e:
        import logging
        import threading
        logging.warning(f"Celery broker unavailable ({str(e)}), running pipeline in background thread.")

        # Capture values for the thread closure
        _job_id = job.id
        _file_id = request.file_id
        _src = request.source_language
        _tgt = request.target_language
        _uid = current_user.id
        _gid = str(request.glossary_id) if request.glossary_id else None

        def _run_pipeline():
            import asyncio
            from app.tasks.document_tasks import run_document_pipeline_async
            asyncio.run(run_document_pipeline_async(
                _job_id, _file_id, _src, _tgt, _uid, _gid
            ))

        threading.Thread(target=_run_pipeline, daemon=True).start()

    return JobResponse(
        id=job.id,
        status=job.status,
        progress=job.progress,
        created_at=job.created_at
    )


@router.get("/", response_model=PaginatedJobResponse)
async def get_job_history(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    source_language: Optional[str] = Query(None),
    target_language: Optional[str] = Query(None),
    mime_type: Optional[str] = Query(None),
    project_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = (
        db.query(TranslationJob, FileModel)
        .outerjoin(FileModel, TranslationJob.file_id == FileModel.id)
        .filter(TranslationJob.user_id == current_user.id)
    )

    if status:
        # Guard against invalid status values to prevent KeyError -> 500
        try:
            status_enum = JobStatus[status.upper()]
        except KeyError:
            valid = [s.name for s in JobStatus]
            raise HTTPException(status_code=400, detail=f"Invalid status '{status}'. Valid values: {valid}")
        query = query.filter(TranslationJob.status == status_enum)
    if source_language:
        query = query.filter(TranslationJob.source_language == source_language)
    if target_language:
        query = query.filter(TranslationJob.target_language == target_language)
    if mime_type:
        # File model stores file_type (extension), not mime_type — filter by extension instead
        # e.g. mime_type="audio/mpeg" → match "mp3", or pass the ext directly
        ext_match = next((k for k, v in _MIME_MAP.items() if mime_type in v), mime_type.split("/")[-1])
        query = query.filter(FileModel.file_type == ext_match)
    if project_id:
        query = query.filter(TranslationJob.project_id == project_id)

    total = query.count()
    results = query.order_by(desc(TranslationJob.created_at)).offset((page - 1) * size).limit(size).all()

    items = []
    for job, file in results:
        proc_time = None
        if job.status in [JobStatus.COMPLETED, JobStatus.FAILED]:
            proc_time = int((job.updated_at - job.created_at).total_seconds())

        if file is None:
            # Job has no associated file record — skip or use placeholders
            file_name = "unknown"
            file_mime = "application/octet-stream"
            file_size = 0
        else:
            # File model has: filename, file_type, storage_path (no mime_type or size columns)
            file_name = file.filename
            file_mime = _MIME_MAP.get(file.file_type, f"application/{file.file_type}")
            try:
                file_size = os.path.getsize(file.storage_path) if file.storage_path and os.path.exists(file.storage_path) else 0
            except Exception:
                file_size = 0

        items.append(JobHistoryResponse(
            id=job.id,
            status=job.status,
            source_language=job.source_language,
            target_language=job.target_language,
            created_at=job.created_at,
            updated_at=job.updated_at,
            filename=file_name,
            mime_type=file_mime,
            size=file_size,
            processing_time_seconds=proc_time
        ))

    return PaginatedJobResponse(
        items=items,
        total=total,
        page=page,
        size=size
    )


@router.delete("/{job_id}")
async def delete_job(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(TranslationJob).filter(TranslationJob.id == job_id, TranslationJob.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    db.delete(job)
    db.commit()
    return {"status": "success"}


@router.post("/{job_id}/retry")
async def retry_job(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(TranslationJob).filter(TranslationJob.id == job_id, TranslationJob.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status not in [JobStatus.FAILED, JobStatus.COMPLETED]:
        raise HTTPException(status_code=400, detail="Can only retry failed or completed jobs.")

    job.status = JobStatus.PENDING
    job.progress = 0
    job.error_message = None
    db.commit()

    # re-queue based on mime-type
    file = db.query(FileModel).filter(FileModel.id == job.file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="Original file missing")

    try:
        file_type = file.file_type or ""
        if file_type in ("mp3", "wav", "m4a"):
            from app.tasks.audio_tasks import process_audio_translation
            process_audio_translation.delay(str(job.id), str(file.id), job.source_language, job.target_language, str(current_user.id))
        elif file_type in ("mp4", "avi", "mov"):
            from app.tasks.video_tasks import process_video_translation
            process_video_translation.delay(str(job.id), str(file.id), job.source_language, job.target_language, str(current_user.id))
        else:
            from app.tasks.document_tasks import process_document_translation
            process_document_translation.delay(str(job.id), str(file.id), job.source_language, job.target_language, str(current_user.id))
    except Exception:
        pass

    return {"status": "retrying"}


@router.get("/{job_id}", response_model=JobResponse)
async def get_job_status(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(TranslationJob).filter(TranslationJob.id == job_id, TranslationJob.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    result_text = None
    result_audio_url = None
    result_video_url = None
    result_pdf_url = None
    result_document_url = None  # FIX: always initialize to avoid UnboundLocalError -> 500
    result_image_url = None
    subtitles_srt_url = None
    subtitles_vtt_url = None
    original_transcript = None
    translation_source = None

    if job.status == JobStatus.COMPLETED and job.result:
        result_text = job.result.result_text
        original_transcript = job.result.original_transcript
        translation_source = job.result.translation_source

        if job.result.result_file_path:
            # Look up the original file to determine the type of the job
            original_file = db.query(FileModel).filter(FileModel.id == job.file_id).first()
            is_video = False
            if original_file and original_file.file_type in ["mp4", "avi", "mov"]:
                is_video = True
            
            file_path_str = str(job.result.result_file_path).lower()
            if is_video or "video" in file_path_str or ".mp4" in file_path_str:
                result_video_url = job.result.result_file_path
            elif ".pdf" in file_path_str or "document" in file_path_str:
                result_pdf_url = job.result.result_file_path
            elif any(ext in file_path_str for ext in [".docx", ".doc", ".pptx", ".ppt", ".txt", ".png", ".jpg", ".jpeg", ".webp"]):
                result_document_url = job.result.result_file_path
            else:
                result_audio_url = job.result.result_file_path

        if getattr(job.result, "result_audio_url", None):
            result_audio_url = job.result.result_audio_url

        if getattr(job.result, "result_image_url", None):
            result_image_url = job.result.result_image_url

        if job.result.subtitles_vtt_path:
            subtitles_vtt_url = f"/api/files/download-path?path={job.result.subtitles_vtt_path}"
        if job.result.subtitles_srt_path:
            subtitles_srt_url = f"/api/files/download-path?path={job.result.subtitles_srt_path}"

    return JobResponse(
        id=job.id,
        status=job.status,
        progress=job.progress,
        error_message=job.error_message,
        created_at=job.created_at,
        original_transcript=original_transcript,
        result_text=result_text,
        result_audio_url=result_audio_url,
        result_video_url=result_video_url,
        result_pdf_url=result_pdf_url,
        result_document_url=result_document_url,
        result_image_url=result_image_url,
        subtitles_srt_url=subtitles_srt_url,
        subtitles_vtt_url=subtitles_vtt_url,
        translation_source=translation_source
    )
