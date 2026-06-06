import uuid

from fastapi import APIRouter, status, Depends, HTTPException, BackgroundTasks
from typing import Annotated
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, UTC, timedelta

from sqlalchemy import delete, select

from app.schemas.user import UserResponse
from app.schemas.auth import Token, RefreshToken, ForgotPassword, ResetPassword
from app.models import User, ResetToken
from app.database import SessionDep
from app.auth import (
    hash_password,
    verify_token,
    verify_password,
    currentUser,
    create_token,
    generate_secure_token,
    hash_reset_token,
)
from app.config import settings
from app.email_utils import send_forgot_password_email, send_password_reset_confirmation

router = APIRouter()


@router.post("/token", response_model=Token, status_code=status.HTTP_202_ACCEPTED)
async def login_for_access_token(
    login_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: SessionDep,
):
    user = await session.scalar(
        select(User).where(User.username == login_data.username)
    )
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid username or password",
        )
    await session.execute(delete(ResetToken).where(ResetToken.user_id == user.id))
    await session.commit()
    expire_timedelta = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_token({"sub": str(user.id)}, "access", expire_timedelta)
    refresh_token = create_token({"sub": str(user.id)}, "refresh")
    return Token(
        access_token=access_token, refresh_token=refresh_token, token_type="Bearer"
    )


@router.post("/refresh", response_model=Token, status_code=status.HTTP_202_ACCEPTED)
async def refresh_access_token(token: RefreshToken, session: SessionDep):
    user_id = verify_token(token.refresh_token, "refresh")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid or expired token"
        )

    user = await session.get(User, uuid.UUID(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="user not found"
        )
    await session.execute(delete(ResetToken).where(ResetToken.user_id == user.id))
    await session.commit()
    expire_timedelta = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_token({"sub": str(user.id)}, "access", expire_timedelta)
    return Token(
        access_token=access_token,
        refresh_token=token.refresh_token,
        token_type="Bearer",
    )


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    user_input: ForgotPassword, background_task: BackgroundTasks, session: SessionDep
):
    user = await session.scalar(select(User).where(User.email == user_input.email))
    if user:
        await session.execute(
            delete(ResetToken).where(ResetToken.user_id == user.id)
        )

        expire = datetime.now(UTC) + timedelta(
            minutes=settings.reset_token_expire_minutes
        )
        reset_token = generate_secure_token()
        new_reset_token = ResetToken(
            token_hash=hash_reset_token(reset_token),
            user_id=user.id,
            expires_at=expire,
        )
        session.add(new_reset_token)
        await session.commit()

        background_task.add_task(
            send_forgot_password_email,
            to_email=user.email,
            username=user.username,
            reset_token=reset_token,
        )

    return {
        "message": "If an account with that email exists, a password reset link has been sent."
    }


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    user_data: ResetPassword, background_task: BackgroundTasks, session: SessionDep
):
    reset_token_hash = hash_reset_token(user_data.reset_token)
    existing_reset_token = await session.scalar(
        select(ResetToken).where(ResetToken.token_hash == reset_token_hash)
    )
    if not existing_reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalid or expire reset token",
        )
    if existing_reset_token.expires_at < datetime.now(UTC):
        await session.delete(existing_reset_token)
        await session.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalid or expire reset token",
        )
    user = await session.get(User, existing_reset_token.user_id)
    if not user:
        await session.delete(existing_reset_token)
        await session.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalid or expire reset token",
        )
    user.password_hash = hash_password(user_data.new_password)
    await session.execute(delete(ResetToken).where(ResetToken.user_id == user.id))
    await session.commit()
    background_task.add_task(
        send_password_reset_confirmation, to_email=user.email, username=user.username
    )
    return {
        "message": "Your password has been successfully updated. Please log in with your new credentials."
    }


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    operation_id="get_current_user",
)
async def authenticated_user(current_user: currentUser):
    return current_user
