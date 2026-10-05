import os
from dotenv import load_dotenv
load_dotenv()
from openai import OpenAI
from app.services.providers.base import TranslationProvider
from app.core.logging import logger

class OpenAITranslationProvider(TranslationProvider):
    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if not text or not text.strip():
            return ""

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.error("OPENAI_API_KEY is not set in environment variables.")
            return f"[ERROR: OPENAI_API_KEY Missing] {text}"

        try:
            client = OpenAI(api_key=api_key)
            src = source_lang if source_lang and source_lang != "auto" else "the original language"
            
            prompt = f"Translate the following text from {src} to {target_lang}. ONLY output the translated text, nothing else. Preserve formatting, newlines, and bullet points perfectly:\n\n{text}"
            
            logger.info(f"OpenAI translation: {src} -> {target_lang}")
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a professional translator. You preserve all formatting and translate accurately."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )
            
            translated_text = response.choices[0].message.content.strip()
            return translated_text
        except Exception as e:
            logger.error(f"OpenAI translation failed: {e}")
            return f"[ERROR: OpenAI Failed] {text}"
