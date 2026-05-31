from fastapi import APIRouter, status, HTTPException, Depends
from app.schemas.user import UserCreate, UserResponse, Token, UserPublicResponse
from app.models import User
from app.auth import hash_password, verify_password, create_access_token, currentUser
from fastapi.security import OAuth2PasswordRequestForm
from typing import Annotated
from datetime import timedelta
from app.config import settings

router = APIRouter()


@router.get("", response_model=list[UserPublicResponse])
async def fetch_users():
    return await User.find_all().to_list()


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserCreate):
    existing_user = await User.find_one(User.username == user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="username already registered",
        )
    registered_email = await User.find_one(User.email == user_data.email)
    if registered_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="email already registered"
        )
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
    )
    await new_user.create()
    return new_user


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


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="user not found"
        )
    await user.delete()
