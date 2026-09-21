import time
import re
from deep_translator import GoogleTranslator
from app.services.providers.base import TranslationProvider
from app.core.logging import logger

# Patterns that indicate Google returned an error page instead of a translation
_ERROR_PATTERNS = [
    r"Error\s+\d{3}\s*\(",
    r"That's an error\.",
    r"There was an error\.",
    r"Please try again later\.",
    r"<html",
    r"<!DOCTYPE",
]
_ERROR_RE = re.compile("|".join(_ERROR_PATTERNS), re.IGNORECASE)

# Keep chunks well under 4500 to reduce rate-limit risk on large texts
_CHUNK_SIZE = 2000


def _is_error_response(text: str) -> bool:
    return bool(_ERROR_RE.search(text or ""))


def _chunk_text(text: str, size: int = _CHUNK_SIZE) -> list[str]:
    """Split text into chunks at sentence/paragraph boundaries."""
    if len(text) <= size:
        return [text]
    chunks = []
    while text:
        if len(text) <= size:
            chunks.append(text)
            break
        split_at = size
        for sep in ("\n\n", "\n", ". ", "! ", "? ", " "):
            pos = text.rfind(sep, 0, size)
            if pos > size // 2:
                split_at = pos + len(sep)
                break
        chunks.append(text[:split_at])
        text = text[split_at:]
    return chunks


import urllib.request
import urllib.parse
import json

class DeepTranslationProvider(TranslationProvider):
    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if not text or not text.strip():
            return ""

        src = source_lang if source_lang and source_lang != "auto" else "auto"
        tgt = target_lang

        try:
            logger.info(f"Fallback translation via deep_translator: {src} -> {tgt}")
            chunks = _chunk_text(text, size=2000)
            translated_chunks = []
            
            translator = GoogleTranslator(source=src, target=tgt)
            
            for chunk in chunks:
                if chunk.strip():
                    import time
                    time.sleep(1.5)  # Avoid Google's 5 req/sec limit!
                    try:
                        translated = translator.translate(chunk)
                        translated_chunks.append(translated or chunk)
                    except Exception as e:
                        logger.warning(f"Chunk translation failed: {e}")
                        translated_chunks.append(f"[ERROR: {e}] " + chunk)
                else:
                    translated_chunks.append(chunk)
            
            return "".join(translated_chunks)

        except Exception as e:
            logger.error(f"Fallback translation permanently failed: {e}")
            return f"[RATE-LIMITED ({tgt})] {text}"
