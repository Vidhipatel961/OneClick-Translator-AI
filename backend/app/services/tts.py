import uuid
import io
from sqlalchemy.orm import Session
from app.services.providers.tts_base import TextToSpeechProvider
from app.services.providers.gtts_provider import GTTSProvider
from app.services.providers.elevenlabs_provider import ElevenLabsProvider
from app.services.file_service import FileStorageService
from app.schemas.tts import TTSResponse
from app.core.exceptions import BaseLingoraException
from app.core.logging import logger
from app.core.config import settings
import asyncio

class TextToSpeechService:
    def __init__(self, provider: TextToSpeechProvider = None):
        if provider:
            self.provider = provider
        elif settings.TTS_PROVIDER_KEY:
            self.provider = ElevenLabsProvider()
        else:
            self.provider = GTTSProvider()
            
        self.file_service = FileStorageService()

    async def synthesize_speech(self, text: str, language: str, voice: str, db: Session, user_id: uuid.UUID, reference_audio_path: str = None) -> TTSResponse:
        try:
            # 1. Synthesize audio bytes
            try:
                audio_bytes = await self.provider.synthesize(text, language, voice, reference_audio_path=reference_audio_path)
            except Exception as provider_err:
                logger.warning(f"Primary TTS provider failed: {provider_err}. Falling back to GTTSProvider.")
                fallback_provider = GTTSProvider()
                audio_bytes = await fallback_provider.synthesize(text, language, voice)
            
            # 2. Save file via FileStorageService
            file_stream = io.BytesIO(audio_bytes)
            # Create a mock FastAPI UploadFile-like object interface for our file service
            class MockUploadFile:
                def __init__(self, name, content_type, file_obj):
                    self.filename = name
                    self.content_type = content_type
                    self.file = file_obj
                    
            mock_file = MockUploadFile(f"tts_{uuid.uuid4().hex[:8]}.mp3", "audio/mpeg", file_stream)
            
            upload_response = await self.file_service.upload_audio_file(
                file=mock_file,
                db=db,
                user_id=user_id
            )
            
            return TTSResponse(
                file_id=upload_response.file_id,
                audio_url=f"/api/files/{upload_response.file_id}/download"
            )
            
        except asyncio.TimeoutError:
            raise BaseLingoraException("Text-to-Speech provider timed out.", status_code=504)
        except BaseLingoraException as e:
            raise e
        except Exception as e:
            logger.error(f"TTS Service failure: {str(e)}")
            raise BaseLingoraException("TTS generation failed.", status_code=500)

    async def clone_voice(self, reference_audio_path: str) -> str | None:
        """Clones a voice using the provider and returns the voice_id."""
        return await self.provider.clone_voice(reference_audio_path)
        
    async def delete_voice(self, voice_id: str) -> bool:
        """Deletes a cloned voice from the provider."""
        return await self.provider.delete_voice(voice_id)
