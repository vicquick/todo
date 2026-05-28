from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
from beanie import init_beanie

client = AsyncIOMotorClient(host=settings.mongo_url.get_secret_value())

db = client["farm-stack"]


async def init_db():
    await init_beanie(database=db, document_models=[])


def close_db():
    client.close()
