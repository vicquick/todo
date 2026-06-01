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


def create_access_token(data: dict, expires_delta: timedelta | None) -> str:
    to_encode = data.copy()
    if expires_delta != None:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(
            minutes=settings.access_token_expire_minutes
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        payload=to_encode,
        key=settings.secret_key.get_secret_value(),
        algorithm=settings.algorithm,
    )
    return encoded_jwt


def verify_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(
            jwt=token,
            key=settings.secret_key.get_secret_value(),
            algorithms=[settings.algorithm],
            options={"require": ["exp", "sub"]},
        )
    except jwt.InvalidTokenError:
        return None
    else:
        return payload.get("sub")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
):
    user_id = verify_access_token(token)
    if user_id == None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid or expired token none",
        )

    user = await User.get(user_id)
    if not user or user == None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="user not found"
        )
    return user


currentUser = Annotated[UserPrivateResponse, Depends(get_current_user)]
