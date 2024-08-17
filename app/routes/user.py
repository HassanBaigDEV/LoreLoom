from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Depends, APIRouter, HTTPException

from app.config.database import db
from app.models.user import User
from app.utils.dependencies import get_current_active_user, get_current_user

user_router = APIRouter()

users_collection = db["users"]


@user_router.get("/me", response_model=User)
async def get_my_profile(payload: dict = Depends(get_current_user)):
    user_id = payload["sub"]
    user = await users_collection.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user = User(**user)
    return user
