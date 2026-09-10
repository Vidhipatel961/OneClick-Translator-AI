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


class DeepTranslationProvider(TranslationProvider):
    _MAX_RETRIES = 4
    # Base delay between retries — grows with each attempt
    _BASE_RETRY_DELAY = 3
    # Polite delay between successful chunk requests to avoid rate-limiting
    _INTER_CHUNK_DELAY = 1.5

    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if not text or not text.strip():
            return ""

        src = source_lang if source_lang and source_lang != "auto" else "auto"
        tgt = target_lang

        chunks = _chunk_text(text.strip())
        logger.info(
            f"DeepTranslationProvider: {len(chunks)} chunks, "
            f"{len(text)} chars, {src} → {tgt}"
        )
        translated_chunks = []

        for i, chunk in enumerate(chunks):
            if not chunk.strip():
                translated_chunks.append(chunk)
                continue
            result = self._translate_chunk_with_retry(chunk, src, tgt, i)
            translated_chunks.append(result)
            # Polite delay between chunks to avoid rate limiting
            if i < len(chunks) - 1:
                time.sleep(self._INTER_CHUNK_DELAY)

        return " ".join(translated_chunks)

    def _translate_chunk_with_retry(
        self, chunk: str, src: str, tgt: str, chunk_index: int = 0
    ) -> str:
        last_error = None

        for attempt in range(1, self._MAX_RETRIES + 1):
            try:
                logger.info(
                    f"Googletrans: chunk {chunk_index} attempt {attempt} "
                    f"({len(chunk)} chars, {src} → {tgt})"
                )
                # deep_translator uses "auto" for auto-detect
                g_src = src if src != "auto" else "auto"
                result = GoogleTranslator(source=g_src, target=tgt).translate(chunk)
                
                if not result:
                    raise ValueError("Translator returned empty result")

                if _is_error_response(result):
                    raise ValueError(
                        f"Translator returned error page: {result[:120]}"
                    )

                return result

            except Exception as e:
                last_error = e
                wait = self._BASE_RETRY_DELAY * attempt
                logger.warning(
                    f"DeepTranslator chunk {chunk_index} attempt {attempt} "
                    f"failed: {e} — waiting {wait}s before retry"
                )
                if attempt < self._MAX_RETRIES:
                    time.sleep(wait)

        raise RuntimeError(
            f"Translation failed after {self._MAX_RETRIES} attempts "
            f"for chunk {chunk_index}: {last_error}"
        )
