# Database management using a class-based approach
from motor.motor_asyncio import AsyncIOMotorClient
import os

class Database:
    client: AsyncIOMotorClient = None
    db = None

    @classmethod
    async def connect(cls):
        url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        cls.client = AsyncIOMotorClient(url)
        cls.db = cls.client.agrihud_db

    @classmethod
    async def close(cls):
        if cls.client:
            cls.client.close()

async def connect_db():
    await Database.connect()

async def close_db():
    await Database.close()

async def get_db():
    return Database.db
