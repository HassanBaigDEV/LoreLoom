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
passages_collection = db["passages"]


async def verify_admin(payload):
    user_id = payload["sub"]
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
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
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    logging.info(f"User: {user}")
  
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    total_users = await users_collection.count_documents({})
    total_stories = await stories_collection.count_documents({})
    total_collaborations = await stories_collection.count_documents({"collaborators": {"$exists": True, "$ne": []}})
    total_active_users = await users_collection.count_documents({"is_active": True})
    total_pending_feedback = await feedback_collection.count_documents({"status": "pending"})
    total_paid_users = await subscription_collection.count_documents({"tier": "premium"})
    return {
        "total_users": total_users,
        "total_active_users": total_active_users,
        "total_pending_feedback": total_pending_feedback,
        "total_stories": total_stories,
        "total_collaborations": total_collaborations,
        "total_paid_users": total_paid_users,
    }


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


@admin_router.post("/login")
async def admin_login(request: AdminLoginRequest):
    try:
        user = await users_collection.find_one({"email": request.email})
        if not user or user.get("role") != "admin":
            raise HTTPException(
                status_code=401, detail="Invalid credentials or not an admin"
            )

        if not verify_password(request.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        user_id = str(user["_id"])

        # Create a user dict without the password
        user_data = dict(user)
        user_data.pop("password", None)
        user_data["id"] = user_id
        user_data["_id"] = user_id

        access_token = create_access_token(data={"sub": user_id})
        refresh_token = create_refresh_token(data={"sub": user_id})

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": user_data,  # Return user data
        }
    except Exception as e:
        logging.error(f"Error during admin login: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@admin_router.get("/stories", response_model=List[StoryResponse])
async def get_all_stories(payload: dict = Depends(get_current_admin)):
    try:
        await verify_admin(payload)
        logging.info("Fetching all stories from database")
        stories = await stories_collection.find().to_list(length=None)
        logging.info(f"Found {len(stories)} stories")

        response = []
        for story in stories:
            try:
                # Convert MongoDB document to dictionary first
                story_dict = dict(story)
                # Apply ObjectId conversions
                story_dict = objectid_to_str(story_dict)

                # --- Always add author_details ---
                author_id = story_dict.get("author")
                author_details = None
                if author_id and ObjectId.is_valid(author_id):
                    try:
                        author = await users_collection.find_one({"_id": ObjectId(author_id)})
                        if author:
                            author_details = {
                                "id": str(author["_id"]),
                                "username": author.get("username"),
                                "email": author.get("email"),
                                "first_name": author.get("first_name"),
                                "last_name": author.get("last_name"),
                            }
                            logging.info(f"Found author details for story {story_dict.get('title')}: {author_details['username']}")
                    except Exception as e:
                        logging.error(f"Error fetching author details for story {story_dict.get('title')}: {str(e)}")
                        author_details = None
                story_dict["author_details"] = author_details

                # --- Always add collaborators as a list of details ---
                collaborators = story_dict.get("collaborators", [])
                collaborator_details = []
                for collab_id in collaborators:
                    if ObjectId.is_valid(collab_id):
                        try:
                            user = await users_collection.find_one({"_id": ObjectId(collab_id)})
                            if user:
                                collab_detail = {
                                    "id": str(user["_id"]),
                                    "username": user.get("username"),
                                    "email": user.get("email"),
                                    "first_name": user.get("first_name"),
                                    "last_name": user.get("last_name"),
                                }
                                collaborator_details.append(collab_detail)
                                logging.info(f"Added collaborator {collab_detail['username']} to story {story_dict.get('title')}")
                        except Exception as e:
                            logging.error(f"Error fetching collaborator details for story {story_dict.get('title')}: {str(e)}")
                story_dict["collaborators"] = collaborator_details

                response.append(story_dict)
            except Exception as e:
                logging.error(f"Error processing story: {str(e)}")
                continue

        logging.info(f"Successfully processed {len(response)} stories")
        return response
    except Exception as e:
        logging.error(f"Error in get_all_stories: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching stories")


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
            author = await users_collection.find_one({"_id": ObjectId(author_id)})
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

@admin_router.get("/collaborations/stats")
async def get_collaboration_stats(payload: dict = Depends(get_current_admin)):
    await verify_admin(payload)
    
    # Get all stories with collaborators
    stories = await stories_collection.find({"collaborators": {"$exists": True, "$ne": []}}).to_list(length=None)
    
    total_collaborations = 0
    active_collaborations = 0
    collaboration_details = []
    
    for story in stories:
        story_id = str(story["_id"])
        story_title = story.get("title", "Untitled")
        collaborators = story.get("collaborators", [])
        
        for collab_id in collaborators:
            total_collaborations += 1
            user = await users_collection.find_one({"_id": collab_id})
            
            if user and user.get("is_active", False):
                active_collaborations += 1
                collaboration_details.append({
                    "story_id": story_id,
                    "story_title": story_title,
                    "collaborator_id": str(collab_id),
                    "collaborator_name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
                    "collaborator_email": user.get("email", ""),
                    "is_active": True
                })
            else:
                collaboration_details.append({
                    "story_id": story_id,
                    "story_title": story_title,
                    "collaborator_id": str(collab_id),
                    "collaborator_name": "Unknown User",
                    "collaborator_email": "N/A",
                    "is_active": False
                })
    
    return {
        "total": total_collaborations,
        "active": active_collaborations,
        "details": collaboration_details
    }

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
            author = await users_collection.find_one({"_id": ObjectId(author_id)})
            story_dict["author_name"] = (
                author.get("username", "Unknown Author") if author else "Unknown Author"
            )
        else:
            story_dict["author_name"] = "Unknown Author"

        stories_with_author.append(story_dict)

    return stories_with_author


class UserActiveStatus(BaseModel):
    is_active: bool

@admin_router.put("/users/{user_id}/active")
async def update_user_active_status(
    user_id: str,
    status: UserActiveStatus,
    payload: dict = Depends(get_current_admin)
):
    try:
        await verify_admin(payload)
        
        # Validate user exists
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Update user's active status
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "is_active": status.is_active,
                    "updated_at": datetime.now()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Failed to update user status")
            
        logging.info(f"Updated active status for user {user_id} to {status.is_active}")
        
        return {
            "message": f"User active status updated to {status.is_active}",
            "user_id": user_id,
            "is_active": status.is_active
        }
        
    except Exception as e:
        logging.error(f"Error updating user active status: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error while updating user status")


@admin_router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    payload: dict = Depends(get_current_admin)
):
    try:
        await verify_admin(payload)
        
        # Validate user exists
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Check if user is an admin
        if user.get("role") == "admin":
            raise HTTPException(status_code=403, detail="Cannot delete an admin user")
            
        # Get user's stories
        user_stories = user.get("stories", [])
        
        # Delete user's stories
        if user_stories:
            try:
                await stories_collection.delete_many({"_id": {"$in": user_stories}})
                logging.info(f"Deleted {len(user_stories)} stories for user {user_id}")
            except Exception as e:
                logging.error(f"Error deleting user's stories: {str(e)}")
        
        # Delete user
        result = await users_collection.delete_one({"_id": ObjectId(user_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=400, detail="Failed to delete user")
            
        logging.info(f"Successfully deleted user {user_id}")
        
        return {
            "message": "User deleted successfully",
            "user_id": user_id,
            "deleted_stories": len(user_stories)
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"Error deleting user: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error while deleting user")

@admin_router.delete("/stories/{story_id}")
async def delete_story(
    story_id: str,
    payload: dict = Depends(get_current_admin)
):
    try:
        await verify_admin(payload)
        
        story = await stories_collection.find_one({"_id": ObjectId(story_id)})
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")
              
        passages = await passages_collection.find({"story_id": story_id}).to_list(length=None)
        
        if passages:
            try:
                await passages_collection.delete_many({"story_id": story_id})
                logging.info(f"Deleted {len(passages)} passages for story {story_id}")
            except Exception as e:
                logging.error(f"Error deleting story's passages: {str(e)}")
                raise HTTPException(status_code=500, detail="Failed to delete story's passages")
        
        result = await stories_collection.delete_one({"_id": ObjectId(story_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Story not found")
        
        return {
            "message": "Story deleted successfully",
            "story_id": story_id,
            "deleted_passages": len(passages) if passages else 0
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"Error deleting story: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error while deleting story")

