from datetime import datetime, timedelta
from typing import Any, Union
import jwt
import bcrypt
from app.core.config import settings

ALGORITHM = "HS256"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password)

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=60 * 24 * 8) # 8 days
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET or "super_secret_key", algorithm=ALGORITHM)
    return encoded_jwt
