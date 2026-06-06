from __future__ import annotations
from uuid import UUID
from pydantic import AliasChoices, BaseModel, ConfigDict, Field
from datetime import datetime


class ListBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class ListResponse(ListBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    items: list[ItemResponse]
    created_at: datetime
    updated_at: datetime


class ListDetailedResponse(ListResponse):
    pass


class ListCreate(ListBase):
    pass


class ListUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)


class ListSummary(BaseModel):
    id: UUID
    name: str
    item_count: int
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
    item_id: UUID
    label: str | None = Field(default=None, min_length=1, max_length=250)
    checked: bool | None = Field(default=None)
    priority: int | None = Field(default=None, ge=1, le=3)
    tags: list[str] | None = Field(default=None)
    description: str | None = Field(default=None, min_length=0, max_length=10000)
    deadline: datetime | None = Field(default=None)


class ItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # API contract keeps `item_id`; the ORM attribute is `id`
    item_id: UUID = Field(validation_alias=AliasChoices("id", "item_id"))
    label: str
    checked: bool
    priority: int | None = None
    tags: list[str] = []
    description: str | None = None
    deadline: datetime | None = None
    created_at: datetime
    updated_at: datetime
