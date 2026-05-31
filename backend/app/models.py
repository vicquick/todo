from beanie import Document, PydanticObjectId
from pydantic import EmailStr
from app.schemas.list import ItemBase
from app.schemas.list import ListSummary


class List(Document):
    user_id: PydanticObjectId
    name: str
    items: list[ItemBase] = []

    @staticmethod
    async def list_summaries(user_id: PydanticObjectId) -> list[ListSummary]:
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$project": {"id": "$_id", "name": 1, "item_count": {"$size": "$items"}}},
        ]
        return await List.aggregate(pipeline, projection_model=ListSummary).to_list()

    class Settings:
        name = "lists"
        indexes = [
            "user_id",
        ]


class User(Document):
    username: str
    email: EmailStr
    password_hash: str

    class Settings:
        name = "users"
