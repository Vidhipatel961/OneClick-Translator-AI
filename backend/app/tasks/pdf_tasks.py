import asyncio
import uuid
from app.core.celery_app import celery_app
from app.database.session import SessionLocal
from app.models.domain import TranslationJob, JobStatus, TranslationResult, File as FileModel
from app.services.translation import TranslationService
from app.services.pdf_processor import PDFProcessor
from app.services.memory_service import save_translation_memory
from app.core.logging import logger
import traceback

translation_service = TranslationService()
pdf_processor = PDFProcessor()

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

async def run_pdf_pipeline_async(job_id: uuid.UUID, file_id: uuid.UUID, source_lang: str, target_lang: str, user_id: uuid.UUID):
    db = SessionLocal()
    try:
        db_file = db.query(FileModel).filter(FileModel.id == file_id).first()
        if not db_file:
            raise Exception("PDF file not found in database.")
            
        pdf_path = db_file.storage_path
        
        # 1. Extract Text & OCR
        _update_job_state(job_id, JobStatus.EXTRACTING_TEXT, 10)
        
        def progress_callback(stage, current, total):
            if stage == "OCR":
                _update_job_state(job_id, JobStatus.PERFORMING_OCR, int(10 + (20 * current / total)))
                
        pages_text, page_count = pdf_processor.process_and_extract(pdf_path, progress_callback)
        
        # 2. Translate
        _update_job_state(job_id, JobStatus.TRANSLATING_DOCUMENT, 40)
        translated_pages = []
        page_count = len(pages_text)
        
        has_ai = False
        has_mem = False
        
        for i, text in enumerate(pages_text):
            if text.strip():
                # For long PDFs, this should ideally be batched.
                translated, src = await translation_service.translate_text(text, source_lang, target_lang, user_id=user_id, db=db)
                translated_pages.append(translated)
                if "Reused" in src:
                    has_mem = True
                else:
                    has_ai = True
            else:
                translated_pages.append("")
                
            progress = int(40 + (40 * (i + 1) / page_count))
            _update_job_state(job_id, JobStatus.TRANSLATING_DOCUMENT, progress)
            
        # 3. Generate PDF
        _update_job_state(job_id, JobStatus.GENERATING_PDF, 85)
        final_pdf_path = pdf_processor.generate_translated_pdf(translated_pages)
        
        # Register the final PDF file
        final_pdf_file = FileModel(
            filename=f"translated_{db_file.filename}",
            file_type="application/pdf",
            storage_path=final_pdf_path,
            project_id=db_file.project_id
        )
        db.add(final_pdf_file)
        db.commit()
        db.refresh(final_pdf_file)
        
        # Determine aggregate source
        if has_ai and has_mem:
            final_source = "Mixed (AI & Memory)"
        elif has_mem:
            final_source = "Reused from Translation Memory"
        else:
            final_source = "AI Translated"

        # 4. Complete
        _update_job_state(job_id, JobStatus.COMPLETED, 100)
        
        res = TranslationResult(
            job_id=job_id,
            original_transcript="\n\n".join(pages_text),
            result_text="\n\n".join(translated_pages),
            result_file_path=f"/api/files/{final_pdf_file.id}/download",
            translation_source=final_source
        )
        db.add(res)
        db.commit()
        
        # 5. Auto-save translation memory
        save_translation_memory(db, job_id, res.original_transcript, res.result_text)
        
    except Exception as e:
        logger.error(f"PDF Job {job_id} failed: {traceback.format_exc()}")
        _update_job_state(job_id, JobStatus.FAILED, 0, str(e))
        raise
    finally:
        db.close()

@celery_app.task(bind=True, max_retries=3)
def process_pdf_translation(self, job_id_str: str, file_id_str: str, source_lang: str, target_lang: str, user_id_str: str):
    job_id = uuid.UUID(job_id_str)
    file_id = uuid.UUID(file_id_str)
    user_id = uuid.UUID(user_id_str)
    try:
        asyncio.run(run_pdf_pipeline_async(job_id, file_id, source_lang, target_lang, user_id))
    except Exception as exc:
        raise self.retry(exc=exc, countdown=10)
