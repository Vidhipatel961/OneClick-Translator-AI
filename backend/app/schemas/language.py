from pydantic import BaseModel

class LanguageConfig(BaseModel):
    code: str
    name: str
    native_name: str
    direction: str  # 'ltr' or 'rtl'
    speech_supported: bool
    translation_supported: bool
    tts_supported: bool
    enabled: bool
