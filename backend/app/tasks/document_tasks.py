import asyncio
import io
import uuid
import os
import mimetypes
import traceback
from typing import List

from app.core.celery_app import celery_app
from app.database.session import SessionLocal
from app.models.domain import TranslationJob, JobStatus, TranslationResult, File as FileModel
from app.services.translation import TranslationService
from app.services.document.factory import DocumentProcessorFactory
from app.services.tts import TextToSpeechService
from app.services.file_service import FileStorageService
from app.services.memory_service import save_translation_memory
from app.core.logging import logger
from app.services.email_service import EmailService
import traceback

translation_service = TranslationService()

def _update_job_state(job_id: uuid.UUID, state: JobStatus, progress: int, error_message: str = None):
    db = SessionLocal()
    try:
        job = db.query(TranslationJob).filter(TranslationJob.id == job_id).first()
        if job:
            job.status = state
            job.progress = progress
            if error_message:
                job.error_message = error_message
            db.commit()
    finally:
        db.close()

async def run_document_pipeline_async(job_id: uuid.UUID, file_id: uuid.UUID, source_lang: str, target_lang: str, user_id: uuid.UUID, glossary_id_str: str = None):
    db = SessionLocal()
    from app.models.domain import UsageRecord
    try:
        db_file = db.query(FileModel).filter(FileModel.id == file_id).first()
        if not db_file:
            raise Exception("Document file not found in database.")
            
        doc_path = db_file.storage_path
        processor = DocumentProcessorFactory.get_processor(doc_path)
        
        # 1. Extract Text
        _update_job_state(job_id, JobStatus.EXTRACTING_TEXT, 10)
        
        def progress_callback(stage, current, total):
            if stage == "OCR":
                _update_job_state(job_id, JobStatus.PERFORMING_OCR, int(10 + (20 * current / total)))
                
        chunks = processor.extract_text(doc_path, progress_callback, lang=source_lang)
        
        # 2. Translate
        _update_job_state(job_id, JobStatus.TRANSLATING_DOCUMENT, 40)
        translated_chunks = []
        chunk_count = len(chunks)
        
        has_ai = False
        has_mem = False
        
        for i, text in enumerate(chunks):
            if text.strip():
                translated, src = await translation_service.translate_text(text, source_lang, target_lang, glossary_id_str, user_id=user_id, db=db)
                translated_chunks.append(translated)
                if "Reused" in src:
                    has_mem = True
                else:
                    has_ai = True
            else:
                translated_chunks.append("")
                
            if chunk_count > 0:
                progress = int(40 + (40 * (i + 1) / chunk_count))
                _update_job_state(job_id, JobStatus.TRANSLATING_DOCUMENT, progress)
            
        # 3. Generate Output File
        _update_job_state(job_id, JobStatus.GENERATING_PDF, 85) # Reusing GENERATING_PDF status for all documents currently
        output_dir = "uploads"
        final_doc_path = processor.generate_translated_file(doc_path, translated_chunks, output_dir)
        
        # Register the final document file
        mime_type, _ = mimetypes.guess_type(final_doc_path)
        final_doc_file = FileModel(
            filename=os.path.basename(final_doc_path),
            file_type=mime_type or "application/octet-stream",
            storage_path=final_doc_path,
            project_id=db_file.project_id
        )
        db.add(final_doc_file)
        db.commit()
        db.refresh(final_doc_file)
        
        # Determine aggregate source
        if has_ai and has_mem:
            final_source = "Mixed (AI & Memory)"
        elif has_mem:
            final_source = "Reused from Translation Memory"
        else:
            final_source = "AI Translated"

        # 4. Generate TTS Audio for the translated text
        _update_job_state(job_id, JobStatus.GENERATING_AUDIO, 90)
        tts_service = TextToSpeechService()
        final_text = "\n\n".join([c for c in translated_chunks if c and c.strip()])
        audio_url = None
        if final_text.strip():
            try:
                tts_res = await tts_service.synthesize_speech(
                    text=final_text,
                    language=target_lang,
                    voice="default",
                    db=db,
                    user_id=user_id
                )
                audio_url = tts_res.audio_url
            except Exception as e:
                logger.warning(f"Background TTS generation failed: {e}")
                audio_url = None

        # 5. Complete
        _update_job_state(job_id, JobStatus.COMPLETED, 100)
        
        is_image = final_doc_file.file_type in ["image/png", "image/jpeg", "image/webp"]
        
        res = TranslationResult(
            job_id=job_id,
            original_transcript="\n\n".join(chunks),
            result_text=final_text,
            result_file_path=f"/api/files/{final_doc_file.id}/download",
            result_audio_url=audio_url,
            result_image_url=f"/api/files/{final_doc_file.id}/download" if is_image else None,
            translation_source=final_source
        )
        db.add(res)
        db.commit()
        
        # 5. Auto-save translation memory
        save_translation_memory(db, job_id, res.original_transcript, res.result_text)
        
    except Exception as e:
        logger.error(f"Document Job {job_id} failed: {traceback.format_exc()}")
        _update_job_state(job_id, JobStatus.FAILED, 0, str(e))
        raise
    finally:
        db.close()

@celery_app.task(bind=True, max_retries=3)
def process_document_translation(self, job_id_str: str, file_id_str: str, source_lang: str, target_lang: str, user_id_str: str, glossary_id_str: str = None):
    job_id = uuid.UUID(job_id_str)
    file_id = uuid.UUID(file_id_str)
    user_id = uuid.UUID(user_id_str)
    try:
        asyncio.run(run_document_pipeline_async(job_id, file_id, source_lang, target_lang, user_id, glossary_id_str))
    except Exception as exc:
        raise self.retry(exc=exc, countdown=10)
