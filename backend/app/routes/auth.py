from fastapi import APIRouter, status, Depends, HTTPException
from app.schemas.user import UserResponse
from app.schemas.auth import Token, RefreshToken
from typing import Annotated
from fastapi.security import OAuth2PasswordRequestForm
from app.models import User
from app.auth import verify_token, verify_password, currentUser, create_token, oauth2_scheme
from datetime import timedelta
from app.config import settings

router = APIRouter()


@router.post("/token", response_model=Token, status_code=status.HTTP_202_ACCEPTED)
async def login_for_access_token(
    login_data: Annotated[OAuth2PasswordRequestForm, Depends()],
):
    user = await User.find_one(User.username == login_data.username)
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid username or password",
        )
    expire_timedelta = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_token({"sub": str(user.id)}, "access", expire_timedelta)
    refresh_token = create_token({"sub": str(user.id)}, "refresh")
    return Token(access_token=access_token, refresh_token=refresh_token, token_type="Bearer")


@router.post("/refresh", response_model=Token, status_code=status.HTTP_202_ACCEPTED)
async def refresh_access_token(token: RefreshToken):
    user_id = verify_token(token.refresh_token, "refresh")
    print(user_id)
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid or expired token")

    user = await User.get(user_id)
    if not user or user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user not found")
    expire_timedelta = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_token({"sub": str(user.id)}, "access", expire_timedelta)
    return Token(access_token=access_token, refresh_token=token.refresh_token, token_type="Bearer")


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def authenticated_user(current_user: currentUser):
    return current_user
