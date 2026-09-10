from abc import ABC, abstractmethod

class TextToSpeechProvider(ABC):
    @abstractmethod
    async def synthesize(self, text: str, language: str, voice: str, reference_audio_path: str = None) -> bytes:
        """Convert text to speech audio bytes."""
        pass
        
    async def clone_voice(self, reference_audio_path: str) -> str | None:
        """Clones a voice and returns a unique voice ID."""
        return None
        
    async def delete_voice(self, voice_id: str) -> bool:
        """Deletes a cloned voice by ID."""
        return False
