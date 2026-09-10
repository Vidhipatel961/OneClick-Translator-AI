import asyncio
import uuid
import os
from app.core.celery_app import celery_app
from app.database.session import SessionLocal
from app.models.domain import TranslationJob, JobStatus, TranslationResult, File as FileModel
from app.services.speech import SpeechToTextService
from app.services.translation import TranslationService
from app.services.tts import TextToSpeechService
from app.services.video_service import VideoService
from app.services.subtitle_service import SubtitleService
from app.services.memory_service import save_translation_memory
from app.core.logging import logger
import traceback

stt_service = SpeechToTextService()
translation_service = TranslationService()
tts_service = TextToSpeechService()
video_service = VideoService()
subtitle_service = SubtitleService()

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

async def run_video_pipeline_async(job_id: uuid.UUID, file_id: uuid.UUID, source_lang: str, target_lang: str, user_id: uuid.UUID, glossary_id_str: str = None):
    db = SessionLocal()
    from app.models.domain import UsageRecord
    audio_path = None
    sample_audio_path = None
    voice_id = None
    try:
        # Get video file
        db_file = db.query(FileModel).filter(FileModel.id == file_id).first()
        if not db_file:
            raise Exception("Video file not found in database.")
            
        video_path = db_file.storage_path
        
        # 1. Extract Audio
        _update_job_state(job_id, JobStatus.EXTRACTING_AUDIO, 10)
        audio_path = video_service.extract_audio(video_path)
        
        # Mocking file upload of extracted audio for STT service if needed,
        # but stt_service usually takes file_id. We'll modify it to take path or bypass.
        # Wait, stt_service.transcribe_audio takes a file_id. 
        # I'll create a temp File record for the extracted audio.
        temp_audio_file = FileModel(
            filename=f"extracted_{job_id}.mp3",
            file_type="audio/mpeg",
            storage_path=audio_path,
            project_id=db_file.project_id
        )
        db.add(temp_audio_file)
        db.commit()
        db.refresh(temp_audio_file)
        
        # 2. STT
        _update_job_state(job_id, JobStatus.TRANSCRIBING, 30)
        stt_result = await stt_service.transcribe_audio(temp_audio_file.id, source_lang, db)
        
        # 3. Translate Text
        _update_job_state(job_id, JobStatus.TRANSLATING, 50)
        translated_text, trans_source = await translation_service.translate_text(stt_result.transcript, source_lang, target_lang, glossary_id_str, user_id=user_id, db=db)
        
        # Process individual segments for accurate subtitle timing and duration
        processed_segments = []
        last_end = 0.0
        
        stt_segments = getattr(stt_result, "segments", [])
        if not stt_segments:
            # Fallback if no segments returned
            stt_segments = [{"start": 0.0, "end": max(5.0, getattr(stt_result, "duration", 5.0)), "text": stt_result.transcript}]
            
        for seg in stt_segments:
            # Handle object vs dict access
            start_val = seg.start if hasattr(seg, 'start') else seg.get("start")
            end_val = seg.end if hasattr(seg, 'end') else seg.get("end")
            text_val = seg.text if hasattr(seg, 'text') else seg.get("text", "")
            
            # 6. Handle missing timestamps
            start_time = float(start_val) if start_val is not None else last_end
            end_time = float(end_val) if end_val is not None else (start_time + 2.0)
            
            # 4. Validate timestamps
            start_time = max(0.0, start_time)
            end_time = max(start_time + 0.1, end_time)
            
            # 5. Handle overlapping subtitles safely
            if start_time < last_end:
                start_time = last_end
                if end_time <= start_time:
                    end_time = start_time + 0.1
                    
            # 2. Preserve existing translation logic (Translate segment individually)
            seg_translated, _ = await translation_service.translate_text(text_val, source_lang, target_lang, glossary_id_str, user_id=user_id, db=db)
            
            # 3. Add duration metadata
            duration = end_time - start_time
            
            processed_segments.append({
                "start": start_time,
                "end": end_time,
                "duration": duration,
                "text": seg_translated
            })
            
            last_end = end_time
        
        # 4. Generate Voice
        _update_job_state(job_id, JobStatus.GENERATING_AUDIO, 70)
        
        # 4.a Clone voice ONCE before the segment loop
        if audio_path:
            sample_audio_path = video_service.extract_voice_sample(audio_path, processed_segments)
            if sample_audio_path:
                voice_id = await tts_service.clone_voice(sample_audio_path)
            
        # Fallback if clone failed or not supported
        if not voice_id:
            voice_id = "clone"
            
        tts_chunks = []
        valid_segments = []
        for seg in processed_segments:
            seg_text = seg["text"]
            if not seg_text.strip():
                # Skip totally empty text or we might hit TTS API errors
                continue
                
            # 6. Keep existing audio generation intact, passing the pre-cloned voice_id
            seg_tts_result = await tts_service.synthesize_speech(seg_text, target_lang, voice_id, db, user_id)
            
            # Get path
            seg_db_file = db.query(FileModel).filter(FileModel.id == seg_tts_result.file_id).first()
            seg_audio_path = seg_db_file.storage_path
            
            # 5. Prevent audio drift (Align duration to exact subtitle bounds)
            if seg["duration"] > 0:
                seg_audio_path = video_service.align_audio_duration(seg_audio_path, seg["duration"])
                
            tts_chunks.append(seg_audio_path)
            valid_segments.append(seg)
            
        # 1-4. Detect gaps, Generate silence, Preserve timing, Prevent overlap
        if tts_chunks:
            translated_audio_path = video_service.build_synchronized_audio_track(valid_segments, tts_chunks, target_audio_path=audio_path)
        else:
            # Fallback if no audio chunks (should not happen on valid video)
            translated_audio_path = audio_path
        
        # 5. Generate Subtitles
        _update_job_state(job_id, JobStatus.GENERATING_SUBTITLES, 80)
        srt_path, vtt_path = subtitle_service.save_subtitles(processed_segments)
        
        # 6. Render Video
        _update_job_state(job_id, JobStatus.RENDERING_VIDEO, 90)
        final_video_path = video_service.render_video_with_audio_and_subs(video_path, translated_audio_path, srt_path)
        
        # Register the final video file
        final_video_file = FileModel(
            filename=f"translated_{db_file.filename}",
            file_type="video/mp4",
            storage_path=final_video_path,
            project_id=db_file.project_id
        )
        db.add(final_video_file)
        db.commit()
        db.refresh(final_video_file)
        
        # 7. Complete
        _update_job_state(job_id, JobStatus.COMPLETED, 100)
        
        res = TranslationResult(
            job_id=job_id,
            original_transcript=stt_result.transcript,
            result_text=translated_text,
            result_file_path=f"/api/files/{final_video_file.id}/download",
            subtitles_srt_path=srt_path,
            subtitles_vtt_path=vtt_path,
            translation_source=trans_source
        )
        db.add(res)
        db.commit()
        
        # 8. Auto-save translation memory
        save_translation_memory(db, job_id, stt_result.transcript, translated_text)
        
    except Exception as e:
        logger.error(f"Video Job {job_id} failed: {traceback.format_exc()}")
        _update_job_state(job_id, JobStatus.FAILED, 0, str(e))
        raise
    finally:
        if voice_id and voice_id != "clone":
            try:
                await tts_service.delete_voice(voice_id)
            except Exception as e:
                logger.warning(f"Failed to cleanup cloned voice {voice_id}: {e}")
                
        if audio_path and os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except Exception as e:
                logger.warning(f"Failed to cleanup temp audio file {audio_path}: {e}")
                
        if sample_audio_path and os.path.exists(sample_audio_path):
            try:
                os.remove(sample_audio_path)
            except Exception as e:
                logger.warning(f"Failed to cleanup temp sample audio file {sample_audio_path}: {e}")
        db.close()

@celery_app.task(bind=True, max_retries=3)
def process_video_translation(self, job_id_str: str, file_id_str: str, source_lang: str, target_lang: str, user_id_str: str, glossary_id_str: str = None):
    job_id = uuid.UUID(job_id_str)
    file_id = uuid.UUID(file_id_str)
    user_id = uuid.UUID(user_id_str)
    try:
        asyncio.run(run_video_pipeline_async(job_id, file_id, source_lang, target_lang, user_id, glossary_id_str))
    except Exception as exc:
        raise self.retry(exc=exc, countdown=10)
