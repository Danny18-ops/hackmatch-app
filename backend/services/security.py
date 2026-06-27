"""Password hashing (bcrypt) + JWT issuing/verification.

Uses the `bcrypt` library directly rather than passlib's bcrypt backend, which
crashes its self-test against bcrypt >= 4.1 (the >72-byte ValueError). bcrypt
ignores everything past 72 bytes, so we truncate explicitly.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from backend.config import settings
from backend.db.models import get_db, User


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: Optional[str]) -> bool:
    if not hashed:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8")[:72], hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(subject, expires_minutes: Optional[int] = None) -> str:
    minutes = expires_minutes or settings.access_token_expire_minutes
    expire = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    payload = {"sub": str(subject), "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


_bearer = HTTPBearer(auto_error=True)


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    cred_exc = HTTPException(status_code=401, detail="Invalid or expired token")
    try:
        payload = jwt.decode(
            creds.credentials, settings.secret_key, algorithms=[settings.algorithm]
        )
        user_id = payload.get("sub")
    except JWTError:
        raise cred_exc
    if user_id is None:
        raise cred_exc
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise cred_exc
    return user
