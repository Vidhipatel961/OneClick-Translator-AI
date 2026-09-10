import asyncio
import io
import edge_tts
from app.services.providers.tts_base import TextToSpeechProvider
from app.core.exceptions import BaseLingoraException
from app.core.logging import logger

# We map simple language codes to a default edge-tts voice
# Edge-TTS produces standard, single-stream MP3s that work perfectly in strict players like WMP.
LANGUAGE_VOICE_MAP = {
    "en": "en-US-ChristopherNeural",
    "gu": "gu-IN-NiranjanNeural",
    "hi": "hi-IN-MadhurNeural",
    "es": "es-ES-AlvaroNeural",
    "fr": "fr-FR-HenriNeural",
    "de": "de-DE-KillianNeural",
    "zh": "zh-CN-YunxiNeural",
    "zh-CN": "zh-CN-YunxiNeural",
    "ar": "ar-SA-HamedNeural"
}

class GTTSProvider(TextToSpeechProvider):
    async def synthesize(self, text: str, language: str, voice: str, reference_audio_path: str = None) -> bytes:
        try:
            logger.info(f"Synthesizing {len(text)} chars to '{language}' via edge-tts")
            
            # Normalize language string to a simple code
            lang_code = language.lower().strip()
            
            # Look up code from name if necessary
            from app.core.languages import LANGUAGES
            for lang in LANGUAGES:
                if lang.name.lower() == lang_code:
                    lang_code = lang.code
                    break
            
            lang_code = lang_code.split("-")[0].lower()
            if language == "zh-CN" or lang_code == "zh":
                lang_code = "zh-CN"
                
            tts_voice = LANGUAGE_VOICE_MAP.get(lang_code, "en-US-ChristopherNeural")
            
            communicate = edge_tts.Communicate(text, tts_voice)
            
            audio_data = bytearray()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data.extend(chunk["data"])
                    
            return bytes(audio_data)

        except Exception as e:
            logger.warning(f"edge-tts failed ({e}), falling back to gTTS for language: {lang_code}")
            try:
                from gtts import gTTS
                # Convert to gTTS format (usually just the 2-letter code)
                gtts_lang = lang_code.split("-")[0]
                tts = gTTS(text, lang=gtts_lang)
                fp = io.BytesIO()
                # Run the blocking save operation in a thread
                await asyncio.to_thread(tts.write_to_fp, fp)
                return fp.getvalue()
            except Exception as fallback_err:
                logger.error(f"gTTS fallback also failed: {fallback_err}")
                raise BaseLingoraException(
                    "Failed to generate speech audio.", status_code=500
                )
