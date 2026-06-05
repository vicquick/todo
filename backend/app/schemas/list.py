from __future__ import annotations
from pydantic import BaseModel, Field
from beanie import PydanticObjectId
from datetime import datetime, UTC


class ListBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)


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
    name: str | None = Field(default=None, min_length=1, max_length=100)
    updated_at: datetime = datetime.now(UTC)


class ListSummary(BaseModel):
    id: PydanticObjectId
    name: str
    item_count: int = Field()
    created_at: datetime
    updated_at: datetime


class ItemBase(BaseModel):
    item_id: str
    label: str
    checked: bool = Field(default=False)
    priority: int | None = Field(default=None)
    tags: list[str] = []
    description: str | None = Field(default=None)
    deadline: datetime | None = Field(default=None)
    created_at: datetime
    updated_at: datetime


class ItemCreate(BaseModel):
    label: str = Field(min_length=1, max_length=250)
    checked: bool = Field(default=False)
    priority: int | None = Field(default=None, ge=1, le=3)
    tags: list[str] = []
    description: str | None = Field(default=None, min_length=0, max_length=10000)
    deadline: datetime | None = Field(default=None)


class ItemUpdatePartial(BaseModel):
    item_id: str
    label: str | None = Field(default=None, min_length=1, max_length=250)
    checked: bool | None = Field(default=None)
    priority: int | None = Field(default=None, ge=1, le=3)
    tags: list[str] = []
    description: str | None = Field(default=None, min_length=0, max_length=10000)
    deadline: datetime | None = Field(default=None)
    updated_at: datetime = datetime.now(UTC)


class ItemResponse(ItemBase):
    pass
