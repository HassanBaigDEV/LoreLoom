from app.config.config import *
from motor.motor_asyncio import AsyncIOMotorClient
from functools import lru_cache

settings = get_settings()

@lru_cache
def get_database():
    # client = MongoClient(
    #     "mongodb://localhost:27017/?directConnection=true"
    # )
    client = AsyncIOMotorClient(settings.MONGO_URI)
    return client["LoreLoom"]
    
db = get_database()
