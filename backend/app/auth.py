from pwdlib import PasswordHash
from datetime import timedelta, datetime, UTC
from app.config import settings
import jwt
from fastapi.security import OAuth2PasswordBearer

from typing import Annotated
from fastapi import Depends, HTTPException, status
from app.models import User
from app.schemas.user import UserPrivateResponse

password_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer("/api/auth/token")


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hash: str) -> bool:
    return password_hash.verify(password, hash)


def create_token(data: dict, type: str, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if type == "refresh":
        expire = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)
    elif expires_delta is not None:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(
            minutes=settings.access_token_expire_minutes
        )
    to_encode.update({"exp": expire, "type": type})
    encoded_jwt = jwt.encode(
        payload=to_encode,
        key=settings.secret_key.get_secret_value(),
        algorithm=settings.algorithm,
    )
    return encoded_jwt


def verify_token(token: str, type: str = "access") -> str | None:
    try:
        payload = jwt.decode(
            jwt=token,
            key=settings.secret_key.get_secret_value(),
            algorithms=[settings.algorithm],
            options={"require": ["exp", "sub", "type"]},
        )
    except jwt.InvalidTokenError:
        return None
    if type == "access" and payload.get("type") != "access":
        return None
    elif type == "refresh" and payload.get("type") != "refresh":
        return None
    else:
        return payload.get("sub")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
):
    user_id = verify_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid or expired token",
        )

    user = await User.get(user_id)
    if not user or user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="user not found"
        )
    return user


currentUser = Annotated[UserPrivateResponse, Depends(get_current_user)]
