from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from datetime import datetime
from bson import ObjectId

from app.utils.security import hash_password
from app.config.settings import settings
from app.models.user import Role  # Add this import


async def create_default_admin():
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client["LoreLoom"]
    users_collection = db["users"]

    # Check if admin already exists
    admin = await users_collection.find_one({"email": "admin@loreloom.com"})
    if admin:
        print("Admin user already exists")
        return

    admin_user = {
        "_id": str(ObjectId()),
        "first_name": "Admin",
        "last_name": "User",
        "username": "admin",
        "email": "admin@loreloom.com",
        "password": hash_password("admin123"),  # Change this password
        "is_active": True,
        "is_verified": True,
        "role": Role.ADMIN,  # Use enum value instead of string
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }

    await users_collection.insert_one(admin_user)
    print("Default admin user created successfully")


if __name__ == "__main__":
    asyncio.run(create_default_admin())
