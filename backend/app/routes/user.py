from uuid import UUID

from fastapi import APIRouter, File, HTTPException, Response, UploadFile, status
from sqlalchemy import distinct, func, select

from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserPublicResponse,
    UserUpdate,
    ChangePassword,
    ApiKeyResponse,
    ApiKeyFullResponse,
    ApiKeyCreate,
)
from app.config import settings
from app.models import ApiKey, Item, List, User, UserImage, Workspace, utcnow
from app.database import SessionDep
from app.auth import (
    hash_password,
    currentUser,
    verify_password,
    generate_secure_token,
    hash_api_key,
)
from datetime import datetime, UTC, timedelta

router = APIRouter()


@router.get("", response_model=list[UserPublicResponse])
async def fetch_users(current_user: currentUser, session: SessionDep):
    result = await session.scalars(select(User).order_by(User.created_at))
    return result.all()


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserCreate, session: SessionDep):
    existing_user = await session.scalar(
        select(User).where(User.username == user_data.username)
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="username already registered",
        )
    registered_email = await session.scalar(
        select(User).where(User.email == user_data.email)
    )
    if registered_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="email already registered"
        )
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
    )
    session.add(new_user)
    await session.commit()
    return new_user


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(current_user: currentUser, session: SessionDep):
    # workspaces, lists, items, api keys and reset tokens cascade at the DB level
    await session.delete(current_user)
    await session.commit()


@router.patch("", response_model=UserResponse, status_code=status.HTTP_202_ACCEPTED)
async def update_user_partial(
    user_data: UserUpdate, current_user: currentUser, session: SessionDep
):
    if user_data.username is not None:
        existing_user = await session.scalar(
            select(User).where(
                User.username == user_data.username, User.id != current_user.id
            )
        )
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="username already registered",
            )
        current_user.username = user_data.username
    if user_data.email is not None:
        registered_email = await session.scalar(
            select(User).where(
                User.email == user_data.email, User.id != current_user.id
            )
        )
        if registered_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="email already registered",
            )
        current_user.email = user_data.email
    current_user.updated_at = utcnow()
    await session.commit()
    return current_user


@router.patch("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    passwordData: ChangePassword, current_user: currentUser, session: SessionDep
):
    if not verify_password(passwordData.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="invalid password"
        )
    current_user.password_hash = hash_password(passwordData.new_password)
    current_user.updated_at = utcnow()
    await session.commit()
    return {"message": "password change sucessfull"}


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_BYTES = 3 * 1024 * 1024


@router.put("/avatar", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def set_avatar(
    current_user: currentUser, session: SessionDep, file: UploadFile = File(...)
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="image must be jpeg, png, webp or gif",
        )
    data = await file.read()
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="image must be 3 MB or smaller",
        )
    image = await session.get(UserImage, current_user.id)
    if image:
        image.mime = file.content_type
        image.data = data
        image.updated_at = utcnow()
    else:
        session.add(
            UserImage(user_id=current_user.id, mime=file.content_type, data=data)
        )
    current_user.avatar_mime = file.content_type
    current_user.updated_at = utcnow()
    await session.commit()
    return current_user


@router.delete("/avatar", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def delete_avatar(current_user: currentUser, session: SessionDep):
    image = await session.get(UserImage, current_user.id)
    if image:
        await session.delete(image)
    current_user.avatar_mime = None
    current_user.updated_at = utcnow()
    await session.commit()
    return current_user


@router.get("/avatar")
async def fetch_avatar(current_user: currentUser, session: SessionDep):
    image = await session.get(UserImage, current_user.id)
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="no avatar set"
        )
    return Response(
        content=image.data,
        media_type=image.mime,
        headers={"Cache-Control": "private, max-age=60"},
    )


@router.get("/tags", status_code=status.HTTP_200_OK, operation_id="list_tags")
async def fetch_user_tags(current_user: currentUser, session: SessionDep):
    stmt = (
        select(distinct(func.unnest(Item.tags)))
        .select_from(Item)
        .join(List, List.id == Item.list_id)
        .join(Workspace, Workspace.id == List.workspace_id)
        .where(Workspace.user_id == current_user.id)
    )
    result = await session.scalars(stmt)
    return result.all()


@router.get(
    "/api-keys", response_model=list[ApiKeyResponse], status_code=status.HTTP_200_OK
)
async def fetch_api_keys(current_user: currentUser, session: SessionDep):
    result = await session.scalars(
        select(ApiKey).where(ApiKey.user_id == current_user.id)
    )
    return result.all()


@router.post(
    "/api-keys", response_model=ApiKeyFullResponse, status_code=status.HTTP_201_CREATED
)
async def create_api_key(
    input_data: ApiKeyCreate, current_user: currentUser, session: SessionDep
):
    api_key_count = await session.scalar(
        select(func.count(ApiKey.id)).where(ApiKey.user_id == current_user.id)
    )
    if api_key_count >= settings.max_api_key_count:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="api key limit reached"
        )
    existing_api_key = await session.scalar(
        select(ApiKey).where(
            ApiKey.name == input_data.name, ApiKey.user_id == current_user.id
        )
    )
    if existing_api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="api key name already in use",
        )
    if input_data.expire_in is not None:
        expire = datetime.now(UTC) + timedelta(days=input_data.expire_in)
    else:
        expire = None

    api_key = generate_secure_token(type="api_key")
    new_api_key = ApiKey(
        user_id=current_user.id,
        name=input_data.name,
        key_hash=hash_api_key(api_key),
        prefix=api_key[:8],
        expires_at=expire,
    )
    session.add(new_api_key)
    await session.commit()
    return ApiKeyFullResponse(
        id=new_api_key.id,
        name=input_data.name,
        prefix=api_key[:8],
        created_at=new_api_key.created_at,
        expires_at=expire,
        key=api_key,
    )


@router.delete("/api-keys/{api_key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_keys(
    api_key_id: UUID, current_user: currentUser, session: SessionDep
):
    api_key = await session.scalar(
        select(ApiKey).where(
            ApiKey.id == api_key_id, ApiKey.user_id == current_user.id
        )
    )
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="api key not found"
        )
    await session.delete(api_key)
    await session.commit()
