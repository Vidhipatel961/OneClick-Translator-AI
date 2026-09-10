import asyncio
import uuid
from sqlalchemy.orm import Session
from app.services.providers.speech_base import SpeechToTextProvider
from app.services.providers.google_stt_provider import GoogleSTTProvider
from app.models.domain import File as FileModel
from app.schemas.speech import TranscriptionResponse
from app.core.exceptions import BaseLingoraException
from app.core.logging import logger


class SpeechToTextService:
    def __init__(self, provider: SpeechToTextProvider = None):
        # Use real Google STT provider by default.
        # Pass a different provider (e.g. MockSpeechProvider) in tests.
        self.provider = provider or GoogleSTTProvider()

    async def transcribe_audio(
        self,
        file_id: uuid.UUID,
        source_language: str,
        db: Session,
    ) -> TranscriptionResponse:
        try:
            # 1. Fetch file path from DB
            db_file = db.query(FileModel).filter(FileModel.id == file_id).first()
            if not db_file:
                raise BaseLingoraException(
                    "File not found in database.", status_code=404
                )

            file_path = db_file.storage_path
            logger.info(
                f"SpeechToTextService: starting transcription for file_id={file_id} "
                f"path={file_path}"
            )

            # 2. Transcribe — no hard timeout for long files; the provider
            #    handles chunking and per-chunk timeouts internally.
            result = await self.provider.transcribe(file_path, source_language)

            logger.info(
                f"SpeechToTextService: completed. "
                f"transcript length={len(result.transcript)} chars, "
                f"duration={result.duration:.1f}s"
            )
            return result

        except BaseLingoraException:
            raise
        except Exception as e:
            logger.error(f"SpeechToTextService: provider failure — {e}")
            raise BaseLingoraException(
                f"Transcription failed: {str(e)}", status_code=500
            )
