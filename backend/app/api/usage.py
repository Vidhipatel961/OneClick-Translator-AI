from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.domain import User, UsageRecord
from app.core.limits import SUBSCRIPTION_LIMITS
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter()

class UsageResponse(BaseModel):
    tier: str
    usage: Dict[str, Any]
    limits: Dict[str, Any]

@router.get("/", response_model=UsageResponse)
async def get_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    usage = db.query(UsageRecord).filter(UsageRecord.user_id == current_user.id).first()
    if not usage:
        usage = UsageRecord(user_id=current_user.id)
        db.add(usage)
        db.commit()
        db.refresh(usage)
        
    tier = current_user.subscription_tier or "FREE"
    limits = SUBSCRIPTION_LIMITS.get(tier, SUBSCRIPTION_LIMITS["FREE"])
    
    usage_dict = {
        "characters_translated": usage.characters_translated,
        "audio_seconds": usage.audio_seconds,
        "video_seconds": usage.video_seconds,
        "documents_processed": usage.documents_processed,
        "ai_requests": usage.ai_requests,
        "storage_bytes": usage.storage_bytes
    }
    
    return UsageResponse(
        tier=tier,
        usage=usage_dict,
        limits=limits
    )
