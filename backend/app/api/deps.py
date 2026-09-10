import uuid
from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.config import settings
from app.models.domain import User
from app.core.security import ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET or "super_secret_key", algorithms=[ALGORITHM]
        )
        token_subject = payload.get("sub")
        if not token_subject:
            raise ValueError("Token is missing its subject")
        user_id = uuid.UUID(token_subject)
    except (jwt.PyJWTError, TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
