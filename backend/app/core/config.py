import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Lingora AI"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:12345@localhost:5432/lingora"
    
    # Security
    JWT_SECRET: str = ""
    
    # Providers
    AI_PROVIDER_KEY: str = ""
    STT_PROVIDER_KEY: str = ""
    TTS_PROVIDER_KEY: str = ""
    ELEVENLABS_API_KEY: str = ""
    
    # Storage
    STORAGE_BUCKET: str = ""
    STORAGE_ACCESS_KEY: str = ""
    STORAGE_SECRET_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
