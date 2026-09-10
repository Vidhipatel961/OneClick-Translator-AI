from abc import ABC, abstractmethod
from app.schemas.speech import TranscriptionResponse

class SpeechToTextProvider(ABC):
    @abstractmethod
    async def transcribe(self, file_path: str, source_language: str) -> TranscriptionResponse:
        """Transcribe an audio file to text."""
        pass
