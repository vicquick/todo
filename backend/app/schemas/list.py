from __future__ import annotations
from pydantic import BaseModel, Field
from beanie import PydanticObjectId
import uuid
from datetime import datetime, UTC


class ListBase(BaseModel):
    name: str = Field(min_length=1, max_length=50)


class ListResponse(ListBase):
    id: PydanticObjectId
    items: list[ItemResponse]
    created_at: datetime
    updated_at: datetime


class ListDetailedResponse(ListBase):
    id: PydanticObjectId
    items: list[ItemResponse]
    created_at: datetime
    updated_at: datetime


class ListCreate(ListBase):
    pass


class ListUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=50)
    updated_at: datetime = datetime.now(UTC)


class ListSummary(BaseModel):
    id: PydanticObjectId
    name: str = Field(min_length=1, max_length=50)
    item_count: int = Field()
    created_at: datetime
    updated_at: datetime


class ItemBase(BaseModel):
    item_id: str
    label: str = Field(min_length=1, max_length=250)
    checked: bool = Field(default=False)
    priority: int | None = Field(default=None, ge=1, le=3)
    tags: list[str] = []
    description: str | None = Field(default=None, min_length=1, max_length=150)
    created_at: datetime
    updated_at: datetime


class ItemCreate(BaseModel):
    label: str = Field(min_length=1, max_length=50)
    checked: bool = Field(default=False)
    priority: int | None = Field(default=None, ge=1, le=3)
    tags: list[str] = []
    description: str | None = Field(default=None, min_length=1, max_length=150)


class ItemUpdatePartial(BaseModel):
    item_id: str
    label: str | None = Field(default=None, min_length=1, max_length=50)
    checked: bool | None = Field(default=None)
    priority: int | None = Field(default=None, ge=1, le=3)
    tags: list[str] = []
    description: str | None = Field(default=None, min_length=1, max_length=150)
    updated_at: datetime = datetime.now(UTC)


class ItemResponse(ItemBase):
    pass
