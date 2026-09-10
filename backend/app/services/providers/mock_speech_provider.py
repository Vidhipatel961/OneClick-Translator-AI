import asyncio
import os
from app.services.providers.speech_base import SpeechToTextProvider
from app.schemas.speech import TranscriptionResponse, TranscriptionSegment
from app.core.exceptions import BaseLingoraException

class MockSpeechProvider(SpeechToTextProvider):
    async def transcribe(self, file_path: str, source_language: str) -> TranscriptionResponse:
        # Simulate network or processing delay
        await asyncio.sleep(2)
        
        # 1. Handle invalid audio / empty
        if not os.path.exists(file_path):
            raise BaseLingoraException("Invalid audio: File not found.", status_code=400)
            
        file_size = os.path.getsize(file_path)
        if file_size == 0:
            raise BaseLingoraException("Empty audio file provided.", status_code=400)
            
        # 2. Simulate unsupported language
        unsupported = ['zz', 'unknown']
        if source_language.lower() in unsupported:
            raise BaseLingoraException(f"Unsupported language: {source_language}", status_code=400)
            
        # 3. Handle specific Gujarati mock vs other
        if source_language.lower() == "gu":
            segments = [
                TranscriptionSegment(start=0.0, end=3.0, text="નમસ્તે મિત્રો"),
                TranscriptionSegment(start=3.1, end=5.5, text="આ લિંગોરા આર્ટિફિશિયલ ઇન્ટેલિજન્સ છે"),
            ]
            transcript = " ".join([s.text for s in segments])
            return TranscriptionResponse(
                transcript=transcript,
                detected_language="gu",
                duration=5.5,
                segments=segments
            )
        else:
            # Generic mock response
            segments = [
                TranscriptionSegment(start=0.0, end=2.0, text="Hello world."),
                TranscriptionSegment(start=2.1, end=4.5, text="This is a simulated transcription."),
            ]
            transcript = " ".join([s.text for s in segments])
            return TranscriptionResponse(
                transcript=transcript,
                detected_language=source_language,
                duration=4.5,
                segments=segments
            )
