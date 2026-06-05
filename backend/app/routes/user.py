from beanie import PydanticObjectId
from fastapi import APIRouter, status, HTTPException
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
from app.models import ApiKey, User, List
from app.auth import (
    hash_password,
    currentUser,
    verify_password,
    generate_secure_token,
    hash_secure_token,
)
from datetime import datetime, UTC, timedelta

router = APIRouter()


@router.get("", response_model=list[UserPublicResponse])
async def fetch_users():
    return await User.find_all().sort("+created_at").to_list()


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


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(current_user: currentUser):
    user = await User.get(current_user.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="user not found"
        )
    await user.delete()


@router.patch("", response_model=UserResponse, status_code=status.HTTP_202_ACCEPTED)
async def update_user_partial(user_data: UserUpdate, current_user: currentUser):
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
    user = await User.get(current_user.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="user not found"
        )
    if user_data.username is not None:
        await user.update({"$set": {"username": user_data.username}})
    if user_data.email is not None:
        await user.update({"$set": {"email": user_data.email}})
    await user.update({"$set": {"updated_at": datetime.now(UTC)}})
    return await user.get(user.id)


@router.patch("/change-password", status_code=status.HTTP_200_OK)
async def change_password(passwordData: ChangePassword, current_user: currentUser):
    if not verify_password(passwordData.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="invalid password"
        )
    user = await User.get(current_user.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="user not found"
        )
    await user.update(
        {"$set": {"password_hash": hash_password(passwordData.new_password)}}
    )
    await user.update({"$set": {"updated_at": datetime.now(UTC)}})
    return {"message": "password change sucessfull"}


@router.get("/tags", status_code=status.HTTP_200_OK)
async def fetch_user_tags(current_user: currentUser):
    return await List.get_all_user_tags(current_user.id)


@router.get(
    "/api-keys", response_model=list[ApiKeyResponse], status_code=status.HTTP_200_OK
)
async def fetch_api_keys(current_user: currentUser):
    return await ApiKey.find_many(ApiKey.user_id == current_user.id).to_list()


@router.post(
    "/api-keys", response_model=ApiKeyResponse, status_code=status.HTTP_201_CREATED
)
async def create_api_key(input_data: ApiKeyCreate, current_user: currentUser):
    api_key_count = await ApiKey.find(ApiKey.user_id == current_user.id).count()
    if api_key_count > settings.max_api_key_count:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="api key limit reached"
        )
    existing_api_key = await ApiKey.find_one(
        ApiKey.name == input_data.name, ApiKey.user_id == current_user.id
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
        key_hash=hash_secure_token(api_key),
        prefix=api_key[:8],
        expires_at=expire,
    )
    await new_api_key.create()
    if new_api_key.id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="failed to create api key",
        )
    return ApiKeyFullResponse(
        id=new_api_key.id,
        name=input_data.name,
        prefix=api_key[:8],
        created_at=datetime.now(UTC),
        expires_at=expire,
        key=api_key,
    )


@router.delete("/api-keys/{api_key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_keys(api_key_id: PydanticObjectId, current_user: currentUser):
    api_key = await ApiKey.find_one(
        ApiKey.id == api_key_id, ApiKey.user_id == current_user.id
    )
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="api key not found"
        )
    await api_key.delete()
