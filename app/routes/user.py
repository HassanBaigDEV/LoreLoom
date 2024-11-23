from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Depends, APIRouter, HTTPException

from app.config.database import db
from app.models.user import UserResponse
import logging

from app.utils.dependencies import get_current_active_user, get_current_user

user_router = APIRouter()

users_collection = db["users"]


@user_router.get("/me")
async def get_my_profile(payload: dict = Depends(get_current_user)):
    try:
        user_id = payload["sub"]
        user = await users_collection.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Convert ObjectId to string before creating UserResponse
        user_dict = {
            **user,
            "id": str(user["_id"]),  # Convert ObjectId to string
            "stories": [
                str(story_id) for story_id in user.get("stories", [])
            ],  # Convert story ObjectIds to strings
        }
        del user_dict["_id"]  # Remove the _id field since we now have id

        return UserResponse(**user_dict)
    except Exception as e:
        logging.error(f"Error in get_my_profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
