from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class WorkspaceBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspaceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    user_id: UUID | None = None


class WorkspaceResponse(WorkspaceBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
