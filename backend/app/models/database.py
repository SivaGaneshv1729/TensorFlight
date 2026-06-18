# Database management using a class-based approach
from motor.motor_asyncio import AsyncIOMotorClient
import os
import asyncio

class MockCollection:
    async def insert_one(self, doc):
        # Do nothing in mock mode
        return None

class MockDB:
    def __init__(self):
        self.telemetry_logs = MockCollection()

class Database:
    client: AsyncIOMotorClient = None
    db = None

    @classmethod
    async def connect(cls):
        url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        print(f"Trying to connect to MongoDB: {url}")
        try:
            # Set a very short timeout for connection
            cls.client = AsyncIOMotorClient(url, serverSelectionTimeoutMS=2000)
            # Try a simple operation to check connectivity
            await cls.client.admin.command('ping')
            cls.db = cls.client.agrihud_db
            print("SUCCESS: MongoDB connected successfully.")
        except Exception as e:
            print(f"WARNING: Could not connect to MongoDB: {e}. Running in NO-DATABASE mode.")
            cls.db = MockDB()

    @classmethod
    async def close(cls):
        if cls.client:
            cls.client.close()

async def connect_db():
    await Database.connect()

async def close_db():
    await Database.close()

async def get_db():
    if Database.db is None:
        return MockDB()
    return Database.db
