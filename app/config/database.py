from pymongo import mongo_client
import pymongo
from app.config.config import settings

client = mongo_client.MongoClient(settings.DATABASE_URL)
print("Connected to MongoDB...")

db = client[settings.MONGO_INITDB_DATABASE]
User = db.users
Post = db.posts
User.create_index([("email", pymongo.ASCENDING)], unique=True)
Post.create_index([("title", pymongo.ASCENDING)], unique=True)

# import os
# from dotenv import load_dotenv
# import pymongo
# from pymongo import MongoClient

# load_dotenv()

# database_url = os.getenv("DATABASE_URL")
# print(f"Connecting to MongoDB at: {database_url}")

# try:
#     client = MongoClient(database_url)
#     db = client[os.getenv("MONGO_INITDB_DATABASE")]
#     print("Connected to MongoDB successfully!")
#     User = db.users
#     Post = db.posts
#     User.create_index([("email", pymongo.ASCENDING)], unique=True)
#     Post.create_index([("title", pymongo.ASCENDING)], unique=True)
# except Exception as e:
#     print(f"Failed to connect to MongoDB: {e}")
