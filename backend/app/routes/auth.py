from fastapi import APIRouter, status, Depends, HTTPException
from app.schemas.user import Token, UserResponse
from typing import Annotated
from fastapi.security import OAuth2PasswordRequestForm
from app.models import User
from app.auth import verify_password, currentUser, create_access_token
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
    access_token = create_access_token({"sub": str(user.id)}, expire_timedelta)
    return Token(access_token=access_token, token_type="Bearer")


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def authenticated_user(current_user: currentUser):
    return current_user
