from beanie import Document, PydanticObjectId
from pydantic import EmailStr
from app.schemas.list import ItemBase
from app.schemas.list import ListSummary
from datetime import datetime, UTC, timedelta

from app.config import settings


class List(Document):
    workspace_id: PydanticObjectId
    name: str
    items: list[ItemBase] = []
    created_at: datetime = datetime.now(UTC)
    updated_at: datetime = datetime.now(UTC)

    @staticmethod
    async def list_summaries(workspace_id: PydanticObjectId) -> list[ListSummary]:
        pipeline = [
            {"$match": {"workspace_id": workspace_id}},
            {
                "$project": {
                    "id": "$_id",
                    "name": 1,
                    "item_count": {"$size": "$items"},
                    "created_at": 1,
                    "updated_at": 1,
                }
            },
        ]
        return await List.aggregate(pipeline, projection_model=ListSummary).to_list()

    @staticmethod
    async def get_all_user_tags(user_id: PydanticObjectId) -> list[str]:
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$unwind": "$items"},
            {"$unwind": "$items.tags"},
            {"$group": {"_id": "$items.tags"}},
            {"$project": {"tag": "$_id", "_id": 0}},
        ]
        results = await List.aggregate(pipeline).to_list()
        return [doc["tag"] for doc in results]

    class Settings:
        name = "lists"
        indexes = ["user_id", "workspace_id"]


class User(Document):
    username: str
    email: EmailStr
    password_hash: str
    created_at: datetime = datetime.now(UTC)
    updated_at: datetime = datetime.now(UTC)

    class Settings:
        name = "users"
        indexes = ["username", "email"]


class ResetToken(Document):
    token_hash: str
    user_id: PydanticObjectId
    created_at: datetime = datetime.now(UTC)
    expires_at: datetime

    class Settings:
        name = "reset_token"
        indexes = ["token_hash", "user_id"]


class ApiKey(Document):
    user_id: PydanticObjectId
    name: str
    key_hash: str
    prefix: str
    is_active: bool = True
    created_at: datetime = datetime.now(UTC)
    expires_at: datetime | None

    class Settings:
        name = "apikey"
        indexes = ["user_id", "name"]


class Workspace(Document):
    user_id: PydanticObjectId
    name: str
    created_at: datetime = datetime.now(UTC)
    updated_at: datetime = datetime.now(UTC)

    class Settings:
        name = "workspaces"
        indexes = ["user_id"]
