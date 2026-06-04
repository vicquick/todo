from pydantic import BaseModel, Field
from beanie import PydanticObjectId
from pydantic import EmailStr
from datetime import datetime, UTC


class UserBase(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    email: EmailStr = Field(max_length=254)


class UserCreate(UserBase):
    password: str = Field(min_length=6)


class UserResponse(UserBase):
    id: PydanticObjectId
    created_at: datetime
    updated_at: datetime


class UserPrivateResponse(BaseModel):
    id: PydanticObjectId
    username: str 
    email: EmailStr 
    password_hash: str
    created_at: datetime
    updated_at: datetime


class UserPublicResponse(BaseModel):
    id: PydanticObjectId
    username: str 
    created_at: datetime
    updated_at: datetime


class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=30)
    email: EmailStr | None = Field(default=None, max_length=254)


class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


