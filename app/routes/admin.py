from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel, EmailStr

from app.config.database import db
from app.utils.dependencies import get_current_admin
from app.models.user import UserResponse, Role
from app.models.feedback import FeedbackResponse, FeedbackUpdate, FeedbackStatus
from app.utils.security import verify_password
from app.auth.jwt_handler import create_access_token, create_refresh_token
from app.models.story import StoryResponse
from app.models.subscription import Subscription
import logging
from app.routes.story import objectid_to_str


admin_router = APIRouter()

# Collections
users_collection = db["users"]
feedback_collection = db["feedback"]
stories_collection = db["stories"]
subscription_collection = db["subscriptions"]


async def verify_admin(payload):
    user_id = payload["sub"]
    user = await users_collection.find_one({"_id": user_id})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@admin_router.get("/users", response_model=List[UserResponse])
async def get_all_users(payload: dict = Depends(get_current_admin)):
    await verify_admin(payload)
    users = await users_collection.find().to_list(length=None)
    return [
        {
            **dict(user),
            "id": str(user["_id"]),
            "stories": [str(story_id) for story_id in user.get("stories", [])],
        }
        for user in users
    ]


@admin_router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str, role: Role, payload: dict = Depends(get_current_admin)
):
    await verify_admin(payload)
    if role not in ["admin", "user"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    result = await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": role, "updated_at": datetime.now()}},
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": f"User role updated to {role}"}


@admin_router.get("/feedback", response_model=List[FeedbackResponse])
async def get_all_feedback(
    status: Optional[FeedbackStatus] = None, payload: dict = Depends(get_current_admin)
):
    await verify_admin(payload)
    query = {}
    if status:
        query["status"] = status

    feedback_list = await feedback_collection.find(query).to_list(length=None)

    if not feedback_list:
        return []

    return [
        {
            **dict(feedback),
            "id": str(feedback["_id"]),
            "user_id": str(feedback["user_id"]),
        }
        for feedback in feedback_list
    ]


@admin_router.put("/feedback/{feedback_id}", response_model=FeedbackResponse)
async def update_feedback(
    feedback_id: str,
    update_data: FeedbackUpdate,
    payload: dict = Depends(get_current_admin),
):
    update_dict = update_data.model_dump(exclude_unset=True)
    update_dict["updated_at"] = datetime.now()

    result = await feedback_collection.update_one(
        {"_id": ObjectId(feedback_id)}, {"$set": update_dict}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Feedback not found")

    feedback = await feedback_collection.find_one({"_id": ObjectId(feedback_id)})
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    return {
        **dict(feedback),
        "id": str(feedback["_id"]),
        "user_id": str(feedback["user_id"]),
    }


@admin_router.get("/dashboard")
async def get_admin_dashboard(payload: dict = Depends(get_current_admin)):
    user_id = payload["sub"]
    print(user_id)
    user = await users_collection.find_one({"_id": user_id})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    total_users = await users_collection.count_documents({})
    active_users = await users_collection.count_documents({"is_active": True})
    pending_feedback = await feedback_collection.count_documents({"status": "pending"})
    print(
        f"Total users: {total_users}, Active users: {active_users}, Pending feedback: {pending_feedback}"
    )
    return {
        "total_users": total_users,
        "active_users": active_users,
        "pending_feedback": pending_feedback,
    }


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


@admin_router.post("/login")
async def admin_login(request: AdminLoginRequest):
    user = await users_collection.find_one({"email": request.email})
    if not user or user.get("role") != "admin":
        raise HTTPException(
            status_code=401, detail="Invalid credentials or not an admin"
        )

    if not verify_password(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_id = str(user["_id"])

    access_token = create_access_token(data={"sub": user_id})
    refresh_token = create_refresh_token(data={"sub": user_id})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


# get all stories
@admin_router.get("/stories", response_model=List[StoryResponse])
async def get_all_stories(payload: dict = Depends(get_current_admin)):
    await verify_admin(payload)
    stories = await stories_collection.find().to_list(length=None)

    response = []
    for story in stories:
        # Convert MongoDB document to dictionary first
        story_dict = dict(story)
        # Apply ObjectId conversions
        story_dict = objectid_to_str(story_dict)
        response.append(story_dict)

    return response


@admin_router.get("/pStories", response_model=List[StoryResponse])
async def get_pstories():
    """
    Retrieve a list of public stories with author's name.
    """
    query = {"privacy": "public"}

    # Fetch stories from the database
    stories = await stories_collection.find(query).to_list(length=100)

    stories_with_author = []
    for story in stories:
        # Convert to dict first for easier manipulation
        story_dict = dict(story)

        # Convert ObjectIds to strings using helper
        story_dict = objectid_to_str(story_dict)

        # Get author ID from already converted string
        author_id = story_dict.get("author")

        if author_id:
            # Now we can query with string ID
            author = await users_collection.find_one({"_id": author_id})
            story_dict["author_name"] = (
                author.get("username", "Unknown Author") if author else "Unknown Author"
            )
        else:
            story_dict["author_name"] = "Unknown Author"

        stories_with_author.append(story_dict)

    return stories_with_author


# get subscription plans
@admin_router.get("/subscription-plans", response_model=List[Subscription])
async def get_all_subscription_plans(payload: dict = Depends(get_current_admin)):
    subscription_plans = await subscription_collection.find().to_list(length=None)
    print(f"Subscription plans: {subscription_plans}")
    return [dict(plan) for plan in subscription_plans]


@admin_router.get("/subscription-plans/{subscription_id}", response_model=Subscription)
async def get_subscription_plan(
    subscription_id: str, payload: dict = Depends(get_current_admin)
):
    subscription = await subscription_collection.find_one(
        {"_id": ObjectId(subscription_id)}
    )
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription plan not found")
    return {**dict(subscription), "id": str(subscription["_id"])}


@admin_router.get("/feedback/{feedback_id}", response_model=FeedbackResponse)
async def get_feedback(feedback_id: str, payload: dict = Depends(get_current_admin)):
    feedback = await feedback_collection.find_one({"_id": ObjectId(feedback_id)})
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return {
        **dict(feedback),
        "id": str(feedback["_id"]),
        "user_id": str(feedback["user_id"]),
    }


# feedback/unread/count")
@admin_router.get("/feedback/unread/count")
async def get_unread_feedback_count(payload: dict = Depends(get_current_admin)):
    count = await feedback_collection.count_documents({"status": FeedbackStatus.UNREAD})
    return {"unread_count": count}


# Add new endpoint for public stories in admin router
@admin_router.get("/pStories", response_model=List[StoryResponse])
async def get_admin_pstories(payload: dict = Depends(get_current_admin)):
    """
    Retrieve public stories with author names (admin version)
    """
    await verify_admin(payload)
    query = {"privacy": "public"}

    stories = await stories_collection.find(query).to_list(length=100)

    stories_with_author = []
    for story in stories:
        story_dict = dict(story)
        story_dict = objectid_to_str(story_dict)

        author_id = story_dict.get("author")
        if author_id:
            author = await users_collection.find_one({"_id": author_id})
            story_dict["author_name"] = (
                author.get("username", "Unknown Author") if author else "Unknown Author"
            )
        else:
            story_dict["author_name"] = "Unknown Author"

        stories_with_author.append(story_dict)

    return stories_with_author
