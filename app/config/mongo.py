from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings
import logging

logging.basicConfig(level=logging.INFO)  # Set global log level to INFO


client = AsyncIOMotorClient(settings.MONGO_URI)
# print(settings.MONGO_URI)
db = client["LoreLoom"]

# Collections
users = db.users
stories = db.stories


# Create indexes
async def setup_indexes():
    await stories.create_index("story_id")
    await stories.create_index("author")  # Index for the user reference
