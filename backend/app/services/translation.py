from app.services.providers.base import TranslationProvider
from app.services.providers.google_provider import DeepTranslationProvider
from app.core.exceptions import BaseLingoraException
from app.core.logging import logger
from app.models.domain import TranslationMemory
from app.services.memory_service import save_translation_memory_direct
from sqlalchemy.orm import Session
import asyncio
import uuid

class TranslationService:
    def __init__(self, provider: TranslationProvider = None):
        # Defaulting to DeepTranslationProvider for free tier testing
        # Can easily swap to OpenAIProvider or AWSTranslateProvider in the future
        self.provider = provider or DeepTranslationProvider()
    async def translate_text(self, text: str, source_lang: str, target_lang: str, glossary_id: str = None, user_id: uuid.UUID = None, db: Session = None) -> tuple[str, str]:
        if not text.strip():
            return text, "AI Translated"

        normalized_text = text.strip()
        
        # 1 & 2. Check TranslationMemory for exact match if db and user_id are provided
        if db and user_id:
            memory_match = db.query(TranslationMemory).filter(
                TranslationMemory.user_id == user_id,
                TranslationMemory.source_language == source_lang,
                TranslationMemory.target_language == target_lang,
                TranslationMemory.source_text == normalized_text
            ).first()
            
            if memory_match and not memory_match.target_text.startswith(("[ERROR:", "[RATE-LIMITED", "Error ")):
                logger.info(f"TranslationService: Memory hit for user {user_id}")
                return memory_match.target_text, "Reused from Translation Memory"

        try:
            logger.info(f"TranslationService: Translating from {source_lang} to {target_lang}")
            # Optional: apply glossary here if supported
            # Translation providers use synchronous SDKs/HTTP clients. Run the
            # blocking call outside the event loop, then await its result.
            translated_text = await asyncio.to_thread(
                self.provider.translate, normalized_text, source_lang, target_lang
            )
            logger.info("TranslationService: Translation completed successfully.")
            
            # Save the successful new translation to memory
            if db and user_id:
                save_translation_memory_direct(
                    db=db,
                    user_id=user_id,
                    source_lang=source_lang,
                    target_lang=target_lang,
                    source_text=normalized_text,
                    target_text=translated_text.strip()
                )
                
            return translated_text, "AI Translated"
        except asyncio.TimeoutError:
            logger.error("TranslationService: Request timed out.")
            raise BaseLingoraException("Translation request timed out. Please try again.", status_code=504)
        except Exception as e:
            logger.error(f"TranslationService: Error during translation: {str(e)}")
            raise BaseLingoraException(f"Failed to translate text: {str(e)}", status_code=500)
