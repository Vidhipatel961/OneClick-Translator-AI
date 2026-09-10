import asyncio
import io
import os
import uuid
import httpx
from app.services.providers.tts_base import TextToSpeechProvider
from app.core.exceptions import BaseLingoraException
from app.core.logging import logger
from app.core.config import settings

class ElevenLabsProvider(TextToSpeechProvider):
    def __init__(self):
        self.api_key = settings.ELEVENLABS_API_KEY or settings.TTS_PROVIDER_KEY
        if not self.api_key:
            logger.warning("ELEVENLABS_API_KEY is missing!")
            
    async def synthesize(self, text: str, language: str, voice: str, reference_audio_path: str = None) -> bytes:
        if not self.api_key:
            raise BaseLingoraException("ElevenLabs API key is missing. Please configure TTS_PROVIDER_KEY.", status_code=500)
            
        voice_id = None
        
        # 1. Check if a pre-cloned voice ID was passed directly
        if voice and voice not in ["clone", "default"]:
            voice_id = voice
        elif reference_audio_path and os.path.exists(reference_audio_path):
            logger.info(f"Cloning voice using reference audio: {reference_audio_path}")
            voice_id = await self.clone_voice(reference_audio_path)
            
        if not voice_id:
            # Fallback to a default voice if cloning failed or wasn't requested
            # Rachel's voice ID
            voice_id = "21m00Tcm4TlvDq8ikWAM"
            
        # 2. Synthesize speech
        return await self._generate_speech(text, voice_id)
        
    async def clone_voice(self, audio_path: str) -> str:
        if not self.api_key:
            return None
            
        if not os.path.exists(audio_path):
            logger.error("Clone voice failed: Audio file does not exist.")
            return None
            
        file_size = os.path.getsize(audio_path)
        if file_size > 10 * 1024 * 1024:
            logger.warning("Clone voice skipped: Audio file exceeds 10MB limit.")
            return None
        if file_size < 10 * 1024:
            logger.warning("Clone voice skipped: Audio file is too small.")
            return None
            
        url = "https://api.elevenlabs.io/v1/voices/add"
        headers = {
            "xi-api-key": self.api_key
        }
        
        try:
            with open(audio_path, 'rb') as f:
                audio_data = f.read()
                
            name = f"ClonedVoice_{uuid.uuid4().hex[:6]}"
            
            async with httpx.AsyncClient() as client:
                files = {
                    'files': (os.path.basename(audio_path), audio_data, 'audio/mpeg')
                }
                data = {
                    'name': name,
                    'description': 'Voice cloned from user video upload.'
                }
                
                response = await client.post(url, headers=headers, data=data, files=files, timeout=60.0)
                
                if response.status_code == 200:
                    voice_id = response.json().get('voice_id')
                    logger.info(f"Successfully cloned voice, received voice_id: {voice_id}")
                    return voice_id
                else:
                    logger.error(f"ElevenLabs clone voice error: status={response.status_code}")
                    return None
        except httpx.TimeoutException:
            logger.error("ElevenLabs clone voice timed out.")
            return None
        except Exception as e:
            logger.error(f"Failed to clone voice with ElevenLabs: {str(e)}")
            return None
            
    async def delete_voice(self, voice_id: str) -> bool:
        if not self.api_key or not voice_id or voice_id in ["21m00Tcm4TlvDq8ikWAM", "clone", "default"]:
            return False
            
        url = f"https://api.elevenlabs.io/v1/voices/{voice_id}"
        headers = {
            "xi-api-key": self.api_key
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(url, headers=headers, timeout=10.0)
                if response.status_code == 200:
                    logger.info(f"Successfully deleted cloned voice: {voice_id}")
                    return True
                else:
                    logger.error(f"ElevenLabs delete voice error: status={response.status_code}")
                    return False
        except httpx.TimeoutException:
            logger.error("ElevenLabs delete voice timed out.")
            return False
        except Exception as e:
            logger.error(f"Failed to delete voice {voice_id} with ElevenLabs: {str(e)}")
            return False
            
    async def _generate_speech(self, text: str, voice_id: str) -> bytes:
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.api_key
        }
        
        data = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=data, headers=headers, timeout=60.0)
                
                if response.status_code == 200:
                    return response.content
                else:
                    logger.error(f"ElevenLabs TTS error: status={response.status_code}")
                    raise BaseLingoraException("Failed to generate speech with ElevenLabs", status_code=500)
        except httpx.TimeoutException:
            logger.error("ElevenLabs TTS request timed out.")
            raise BaseLingoraException("ElevenLabs TTS request timed out.", status_code=504)
        except Exception as e:
            logger.error(f"ElevenLabs TTS request failed: {str(e)}")
            raise BaseLingoraException("Failed to connect to TTS provider", status_code=500)
