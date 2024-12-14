from datetime import datetime, timedelta, timezone
from typing import Annotated, List
from fastapi import Depends, APIRouter, HTTPException, status, UploadFile, File
from bson import ObjectId

import jwt
from fastapi import Depends, APIRouter, HTTPException

from app.config.database import db
from app.models.user import UserResponse, UpdateUserRequest
import logging

from app.utils.dependencies import get_current_active_user, get_current_user
from app.utils.security import hash_password, verify_password

import base64
from typing import Optional

user_router = APIRouter()

users_collection = db["users"]


@user_router.get("/me", response_model=UserResponse)
async def get_my_profile(payload: dict = Depends(get_current_user)):
    try:
        user_id = payload["sub"]
        user = await users_collection.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_dict = dict(user)
        user_dict["id"] = str(user_dict.pop("_id"))
        user_dict["stories"] = [str(story_id) for story_id in user_dict.get("stories", [])]

        return UserResponse(**user_dict)
    except Exception as e:
        logging.error(f"Error in get_my_profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@user_router.put("/me", response_model=UserResponse)
async def update_my_profile(
    update_data: UpdateUserRequest,
    payload: dict = Depends(get_current_user)
):
    try:
        user_id = payload["sub"]
        
        # Check if username is being updated and is unique
        if update_data.username:
            existing_user = await users_collection.find_one({
                "username": update_data.username,
                "_id": {"$ne": user_id}
            })
            if existing_user:
                raise HTTPException(
                    status_code=400,
                    detail="Username already taken"
                )

        # Prepare update data
        update_dict = update_data.model_dump(exclude_unset=True)
        if update_dict:
            update_dict["updated_at"] = datetime.now()
            
            # Update user
            result = await users_collection.update_one(
                {"_id": user_id},
                {"$set": update_dict}
            )
            
            if result.modified_count == 0:
                raise HTTPException(status_code=404, detail="User not found")

        # Get updated user
        user = await users_collection.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_dict = {
            **user,
            "id": str(user["_id"]),
            "stories": [str(story_id) for story_id in user.get("stories", [])],
        }
        del user_dict["_id"]

        return UserResponse(**user_dict)
    except Exception as e:
        logging.error(f"Error in update_my_profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@user_router.delete("/me")
async def delete_my_account(
    payload: dict = Depends(get_current_user)
):
    try:
        user_id = payload["sub"]
        result = await users_collection.delete_one({"_id": user_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {"message": "Account successfully deleted"}
    except Exception as e:
        logging.error(f"Error in delete_my_account: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@user_router.get("/users/{username}", response_model=UserResponse)
async def get_user_by_username(username: str):
    try:
        user = await users_collection.find_one({"username": username})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_dict = dict(user)
        user_dict["id"] = str(user_dict.pop("_id"))
        user_dict["stories"] = [str(story_id) for story_id in user_dict.get("stories", [])]

        return UserResponse(**user_dict)
    except Exception as e:
        logging.error(f"Error in get_user_by_username: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@user_router.post("/me/photo")
async def update_profile_photo(
    photo: UploadFile = File(...),
    payload: dict = Depends(get_current_user)
):
    try:
        user_id = payload["sub"]
        
        # Read and encode the image
        contents = await photo.read()
        encoded_photo = base64.b64encode(contents).decode('utf-8')
        
        # Validate file size (e.g., 5MB limit)
        if len(contents) > 5 * 1024 * 1024:  # 5MB in bytes
            raise HTTPException(
                status_code=400,
                detail="File size too large. Maximum size is 5MB"
            )
            
        # Validate file type
        if photo.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
            raise HTTPException(
                status_code=400,
                detail="Only JPEG and PNG files are allowed"
            )
            
        # Update user's photo in database
        result = await users_collection.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "photo": f"data:{photo.content_type};base64,{encoded_photo}",
                    "updated_at": datetime.now()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {"message": "Profile photo updated successfully"}
        
    except Exception as e:
        logging.error(f"Error in update_profile_photo: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@user_router.delete("/me/photo")
async def remove_profile_photo(
    payload: dict = Depends(get_current_user)
):
    try:
        user_id = payload["sub"]
        
        result = await users_collection.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "photo": None,
                    "updated_at": datetime.now()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {"message": "Profile photo removed successfully"}
        
    except Exception as e:
        logging.error(f"Error in remove_profile_photo: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
