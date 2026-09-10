from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from sqlalchemy import text
from app.core.celery_app import celery_app

router = APIRouter()

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    health_status = {
        "status": "ok",
        "service": "Lingora AI",
        "components": {
            "database": "unknown",
            "redis_celery": "unknown"
        }
    }
    
    # Check DB
    try:
        db.execute(text("SELECT 1"))
        health_status["components"]["database"] = "ok"
    except Exception:
        health_status["components"]["database"] = "down"
        health_status["status"] = "degraded"
        
    # Check Celery/Redis
    try:
        # Simple ping to broker
        celery_app.broker_connection().ensure_connection(max_retries=1)
        health_status["components"]["redis_celery"] = "ok"
    except Exception:
        health_status["components"]["redis_celery"] = "down"
        health_status["status"] = "degraded"
        
    return health_status
