from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.domain import User
from app.schemas.speech import TranscriptionRequest, TranscriptionResponse
from app.schemas.tts import TTSRequest, TTSResponse
from app.services.speech import SpeechToTextService
from app.services.tts import TextToSpeechService

router = APIRouter()
stt_service = SpeechToTextService()
tts_service = TextToSpeechService()

@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio_endpoint(
    request: TranscriptionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Transcribe an uploaded audio file into text with timestamps."""
    return await stt_service.transcribe_audio(
        file_id=request.file_id, 
        source_language=request.source_language,
        db=db
    )

@router.post("/synthesize", response_model=TTSResponse)
async def synthesize_speech_endpoint(
    request: TTSRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Convert text to speech audio file."""
    return await tts_service.synthesize_speech(
        text=request.text,
        language=request.language,
        voice=request.voice,
        db=db,
        user_id=current_user.id
    )
