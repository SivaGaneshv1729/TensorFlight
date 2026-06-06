# Placeholder for MongoDB Motor async connection
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")

client = AsyncIOMotorClient(MONGODB_URL)
db = client.agrihud_db

async def get_db():
    return db
