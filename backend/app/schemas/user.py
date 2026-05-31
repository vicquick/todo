from pydantic import BaseModel, Field
from beanie import PydanticObjectId
from pydantic import EmailStr


class UserBase(BaseModel):
    username: str = Field(min_length=4, max_length=25)
    email: EmailStr = Field(max_length=50)


class UserCreate(UserBase):
    password: str = Field(min_length=6)


class UserResponse(UserBase):
    id: PydanticObjectId


class UserPublicResponse(BaseModel):
    id: PydanticObjectId
    username: str = Field(min_length=4, max_length=25)


class Token(BaseModel):
    access_token: str
    token_type: str
