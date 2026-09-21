import asyncio
import uuid
from app.core.celery_app import celery_app
from app.database.session import SessionLocal
from app.models.domain import TranslationJob, JobStatus, TranslationResult
from app.services.speech import SpeechToTextService
from app.services.translation import TranslationService
from app.services.tts import TextToSpeechService
from app.services.memory_service import save_translation_memory
from app.core.logging import logger
from app.services.email_service import EmailService
import traceback

stt_service = SpeechToTextService()
translation_service = TranslationService()
tts_service = TextToSpeechService()

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

async def run_audio_pipeline_async(job_id: uuid.UUID, file_id: uuid.UUID, source_lang: str, target_lang: str, user_id: uuid.UUID, glossary_id_str: str = None):
    db = SessionLocal()
    from app.models.domain import UsageRecord
    try:
        # 1. STT
        _update_job_state(job_id, JobStatus.TRANSCRIBING, 10)
        stt_result = await stt_service.transcribe_audio(file_id, source_lang, db)
        
        # 2. Translate
        _update_job_state(job_id, JobStatus.TRANSLATING, 40)
        translated_text, trans_source = await translation_service.translate_text(stt_result.transcript, source_lang, target_lang, glossary_id_str, user_id=user_id, db=db)
        
        # 2b. Translate Segments for Subtitles
        from app.services.subtitle_service import SubtitleService
        subtitle_service = SubtitleService()
        processed_segments = []
        last_end = 0.0
        stt_segments = getattr(stt_result, "segments", [])
        if not stt_segments:
            stt_segments = [{"start": 0.0, "end": max(5.0, getattr(stt_result, "duration", 5.0)), "text": stt_result.transcript}]
            
        for seg in stt_segments:
            start_val = seg.start if hasattr(seg, 'start') else seg.get("start")
            end_val = seg.end if hasattr(seg, 'end') else seg.get("end")
            text_val = seg.text if hasattr(seg, 'text') else seg.get("text", "")
            
            start_time = float(start_val) if start_val is not None else last_end
            end_time = float(end_val) if end_val is not None else (start_time + 2.0)
            start_time = max(0.0, start_time)
            end_time = max(start_time + 0.1, end_time)
            if start_time < last_end:
                start_time = last_end
                if end_time <= start_time:
                    end_time = start_time + 0.1
                    
            seg_translated, _ = await translation_service.translate_text(text_val, source_lang, target_lang, glossary_id_str, user_id=user_id, db=db)
            
            processed_segments.append({
                "start": start_time,
                "end": end_time,
                "duration": end_time - start_time,
                "text": seg_translated
            })
            last_end = end_time

        srt_path, vtt_path = subtitle_service.save_subtitles(processed_segments)

        # 3. TTS
        _update_job_state(job_id, JobStatus.GENERATING_AUDIO, 70)
        tts_result = await tts_service.synthesize_speech(translated_text, target_lang, "default", db, user_id)
        
        # 4. Save result
        _update_job_state(job_id, JobStatus.COMPLETED, 100)
        job = db.query(TranslationJob).filter(TranslationJob.id == job_id).first()
        if job:
            res = TranslationResult(
                job_id=job.id,
                original_transcript=stt_result.transcript,
                result_text=translated_text,
                result_file_path=tts_result.audio_url,
                translation_source=trans_source,
                subtitles_srt_path=srt_path,
                subtitles_vtt_path=vtt_path
            )
            db.add(res)
            db.commit()
            
            # 5. Auto-save translation memory
            save_translation_memory(db, job_id, stt_result.transcript, translated_text)
    except Exception as e:
        logger.error(f"Job {job_id} failed: {traceback.format_exc()}")
        _update_job_state(job_id, JobStatus.FAILED, 0, str(e))
        raise
    finally:
        db.close()

@celery_app.task(bind=True, max_retries=3)
def process_audio_translation(self, job_id_str: str, file_id_str: str, source_lang: str, target_lang: str, user_id_str: str, glossary_id_str: str = None):
    """Celery task to run the full audio translation pipeline."""
    job_id = uuid.UUID(job_id_str)
    file_id = uuid.UUID(file_id_str)
    user_id = uuid.UUID(user_id_str)
    
    try:
        # Run the async pipeline in an event loop
        asyncio.run(run_audio_pipeline_async(job_id, file_id, source_lang, target_lang, user_id, glossary_id_str))
    except Exception as exc:
        logger.error(f"Celery task failed, retrying: {str(exc)}")
        raise self.retry(exc=exc, countdown=10) # Retry after 10s on recoverable failure
