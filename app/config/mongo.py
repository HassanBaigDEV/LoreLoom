from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings
import logging

# Set the logging level for the MongoDB driver to WARNING
logging.getLogger("pymongo").setLevel(logging.WARNING)

# Set the logging level for the entire application
logging.basicConfig(level=logging.INFO)

client = AsyncIOMotorClient(settings.MONGO_URI)
# print(settings.MONGO_URI)
db = client["LoreLoom"]
if db is not None:
    logging.info("Connected to MongoDB", db)
else:
    logging.error("Failed to connect to MongoDB")
    raise Exception("Failed to connect to MongoDB")

# Collections
users = db.users
stories = db.stories
passages = db.passages
vectors = db.vectors


# Create indexes
async def setup_indexes():
    await stories.create_index("story_id")
    await stories.create_index("author")  # Index for the user reference
