# Placeholder for MongoDB Motor async connection
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")

client = None
db = None

async def connect_db():
    global client, db
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client.agrihud_db

async def close_db():
    global client
    if client:
        client.close()

async def get_db():
    return db
