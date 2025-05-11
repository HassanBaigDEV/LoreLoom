from fastapi import APIRouter, Depends, HTTPException, Body
from datetime import datetime
from bson import ObjectId
from typing import List

from app.utils.dependencies import get_current_user, get_current_admin
from app.config.database import db
from app.utils.dependencies import get_current_user
from app.models.feedback import (
    FeedbackCreate,
    FeedbackResponse,
    FeedbackStatus,
    FeedbackResponseCreate,
)
from app.routes.admin import verify_admin

feedback_router = APIRouter()
feedback_collection = db["feedback"]


@feedback_router.post("/feedback", response_model=FeedbackResponse)
async def create_feedback(
    feedback: FeedbackCreate, payload: dict = Depends(get_current_user)
):
    user_id = payload["sub"]

    feedback_dict = feedback.model_dump()
    feedback_dict["user_id"] = user_id
    feedback_dict["status"] = FeedbackStatus.PENDING
    feedback_dict["created_at"] = datetime.now()
    feedback_dict["updated_at"] = datetime.now()
    feedback_dict["_id"] = ObjectId()

    await feedback_collection.insert_one(feedback_dict)

    return {
        **feedback_dict,
        "id": str(feedback_dict["_id"]),
        "user_id": str(feedback_dict["user_id"]),
    }


@feedback_router.get("/feedback/me", response_model=List[FeedbackResponse])
async def get_my_feedback(payload: dict = Depends(get_current_user)):
    user_id = payload["sub"]
    feedback_list = await feedback_collection.find({"user_id": user_id}).to_list(
        length=None
    )

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


@feedback_router.get("/feedback/{feedback_id}", response_model=FeedbackResponse)
async def get_feedback(
    feedback_id: str,
):
    feedback = await feedback_collection.find_one(
        {
            "_id": ObjectId(feedback_id),
        }
    )

    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    return {
        **dict(feedback),
        "id": str(feedback["_id"]),
        "user_id": str(feedback["user_id"]),
    }


@feedback_router.get("/feedback/unread/count")
async def get_unread_feedback_count():
    count = await feedback_collection.count_documents({"status": FeedbackStatus.UNREAD})
    return {"unread_count": count}


@feedback_router.put(
    "/feedback/{feedback_id}/response", response_model=FeedbackResponse
)
async def respond_to_feedback(
    feedback_id: str,
    response_data: FeedbackResponseCreate = Body(...),
    payload: dict = Depends(get_current_admin),
):
    try:
        feedback = await feedback_collection.find_one({"_id": ObjectId(feedback_id)})
        if not feedback:
            raise HTTPException(status_code=404, detail="Feedback not found")

        # Validate status
        if response_data.status not in FeedbackStatus.__members__.values():
            raise HTTPException(status_code=400, detail="Invalid status")

        update_dict = {
            "admin_response": response_data.response,
            "status": response_data.status,
            "updated_at": datetime.now(),
        }

        await feedback_collection.update_one(
            {"_id": ObjectId(feedback_id)}, {"$set": update_dict}
        )

        updated_feedback = await feedback_collection.find_one(
            {"_id": ObjectId(feedback_id)}
        )
        if not updated_feedback:
            raise HTTPException(status_code=404, detail="Feedback not found")

        return {
            **dict(updated_feedback),
            "id": str(updated_feedback["_id"]),
            "user_id": str(updated_feedback["user_id"]),
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@feedback_router.put("/feedback/{feedback_id}/mark-read")
async def mark_feedback_as_read(
    feedback_id: str,
):
    # user_id = payload["sub"]
    result = await feedback_collection.update_one(
        {"_id": ObjectId(feedback_id)}, {"$set": {"status": FeedbackStatus.READ}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Feedback not found")

    return {"message": "Feedback marked as read"}


@feedback_router.put("/feedback/{feedback_id}/status", response_model=FeedbackResponse)
async def update_feedback_status(
    feedback_id: str,
    status_data: dict = Body(...),
    payload: dict = Depends(get_current_admin),
):
    try:
        feedback = await feedback_collection.find_one({"_id": ObjectId(feedback_id)})
        if not feedback:
            raise HTTPException(status_code=404, detail="Feedback not found")

        status = status_data.get("status")
        if not status:
            raise HTTPException(status_code=400, detail="Status is required")

        # Validate status
        if status not in FeedbackStatus.__members__.values():
            raise HTTPException(status_code=400, detail="Invalid status")

        update_dict = {
            "status": status,
            "updated_at": datetime.now(),
        }

        await feedback_collection.update_one(
            {"_id": ObjectId(feedback_id)}, {"$set": update_dict}
        )

        updated_feedback = await feedback_collection.find_one(
            {"_id": ObjectId(feedback_id)}
        )
        if not updated_feedback:
            raise HTTPException(status_code=404, detail="Feedback not found")

        return {
            **dict(updated_feedback),
            "id": str(updated_feedback["_id"]),
            "user_id": str(updated_feedback["user_id"]),
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


# delete feedback
@feedback_router.delete("/feedback/{feedback_id}")
async def delete_feedback(feedback_id: str):
    await feedback_collection.delete_one({"_id": ObjectId(feedback_id)})
    return {"message": "Feedback deleted successfully"}
