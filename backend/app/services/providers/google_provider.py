import time
import re
import urllib.request
import urllib.parse
import json
from deep_translator import GoogleTranslator
from app.services.providers.base import TranslationProvider
from app.core.logging import logger

_CHUNK_SIZE = 2500


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


def _translate_google_api(text: str, src: str, tgt: str) -> str:
    """
    Translate text using Google's translate_a/single endpoint.
    Fast, reliable, and avoids the 429 rate-limit blocks on translate.google.com/m.
    """
    url = "https://translate.googleapis.com/translate_a/single"
    params = {
        "client": "gtx",
        "sl": src,
        "tl": tgt,
        "dt": "t",
        "q": text,
    }
    data = urllib.parse.urlencode(params).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "*/*",
        },
    )
    with urllib.request.urlopen(req, timeout=20) as response:
        result = json.loads(response.read().decode("utf-8"))
        if result and result[0]:
            return "".join(part[0] for part in result[0] if part and part[0])
    return ""


def _translate_chunk_with_fallback(chunk: str, src: str, tgt: str) -> str:
    """Translate a single chunk using primary Google client API, with deep_translator fallback."""
    # 1. Primary: Direct Google Client API
    try:
        translated = _translate_google_api(chunk, src, tgt)
        if translated:
            return translated
    except Exception as e:
        logger.warning(f"Google APIs client translation failed: {e}")

    # 2. Secondary fallback: deep_translator GoogleTranslator
    try:
        translator = GoogleTranslator(source=src, target=tgt)
        translated = translator.translate(chunk)
        if translated:
            return translated
    except Exception as e:
        logger.warning(f"deep_translator GoogleTranslator failed: {e}")

    # 3. If all translation attempts fail, raise so calling service handles it properly
    raise RuntimeError(f"Translation failed for target language '{tgt}'")


class DeepTranslationProvider(TranslationProvider):
    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if not text or not text.strip():
            return ""

        src = source_lang if source_lang and source_lang != "auto" else "auto"
        tgt = target_lang

        if src == tgt and src != "auto":
            return text

        logger.info(f"Translating text ({src} -> {tgt}, {len(text)} chars)")
        chunks = _chunk_text(text, size=_CHUNK_SIZE)
        translated_chunks = []

        for chunk in chunks:
            if chunk.strip():
                translated = _translate_chunk_with_fallback(chunk, src, tgt)
                translated_chunks.append(translated)
            else:
                translated_chunks.append(chunk)

        return "".join(translated_chunks)

