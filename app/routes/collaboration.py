from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Union
from bson import ObjectId
from pydantic import BaseModel, Field, EmailStr
import json
from app.config.mongo import db
from app.services.collaboration import (
    add_collaborator,
    remove_collaborator,
    get_collaborators,
    check_access,
    add_collaborator_by_email,
    remove_collaborator_by_email,
    find_user_by_email,
)

router = APIRouter()

# Collection references
stories = db["stories"]


class CollaboratorRequest(BaseModel):
    """Request model for adding/removing collaborators by ID"""

    user_id: str = Field(
        ..., description="ID of the user making the request (must be the author)"
    )
    collaborator_id: str = Field(
        ..., description="ID of the user to add/remove as collaborator"
    )


class CollaboratorEmailRequest(BaseModel):
    """Request model for adding/removing collaborators by email"""

    user_id: str = Field(
        ..., description="ID of the user making the request (must be the author)"
    )
    email: EmailStr = Field(
        ..., description="Email of the user to add/remove as collaborator"
    )


class CollaboratorResponse(BaseModel):
    """Response model for collaborator operations"""

    success: bool
    message: str
    story_id: str
    collaborator_ids: List[str] = []


@router.post("/stories/{story_id}/collaborators", response_model=CollaboratorResponse)
async def add_story_collaborator(story_id: str, request: CollaboratorRequest):
    """
    Add a collaborator to a story by user ID
    """
    try:
        story = await add_collaborator(
            story_id, request.user_id, request.collaborator_id
        )

        # Extract collaborator IDs and convert to strings for response
        collaborator_ids = [
            str(collab_id) for collab_id in story.get("collaborators", [])
        ]

        return CollaboratorResponse(
            success=True,
            message="Collaborator added successfully",
            story_id=story_id,
            collaborator_ids=collaborator_ids,
        )
    except HTTPException as e:
        # Re-raise the HTTP exception
        raise e
    except Exception as e:
        # Handle any other exceptions
        raise HTTPException(
            status_code=500, detail=f"Failed to add collaborator: {str(e)}"
        )


@router.post(
    "/stories/{story_id}/collaborators/email", response_model=CollaboratorResponse
)
async def add_story_collaborator_by_email(
    story_id: str, request: CollaboratorEmailRequest
):
    """
    Add a collaborator to a story by email
    """
    try:
        story = await add_collaborator_by_email(
            story_id, request.user_id, request.email
        )

        # Extract collaborator IDs and convert to strings for response
        collaborator_ids = [
            str(collab_id) for collab_id in story.get("collaborators", [])
        ]

        return CollaboratorResponse(
            success=True,
            message="Collaborator added successfully",
            story_id=story_id,
            collaborator_ids=collaborator_ids,
        )
    except HTTPException as e:
        # Re-raise the HTTP exception
        raise e
    except Exception as e:
        # Handle any other exceptions
        raise HTTPException(
            status_code=500, detail=f"Failed to add collaborator: {str(e)}"
        )


@router.delete("/stories/{story_id}/collaborators", response_model=CollaboratorResponse)
async def remove_story_collaborator(story_id: str, request: CollaboratorRequest):
    """
    Remove a collaborator from a story by user ID
    """
    try:
        story = await remove_collaborator(
            story_id, request.user_id, request.collaborator_id
        )

        # Extract collaborator IDs and convert to strings for response
        collaborator_ids = [
            str(collab_id) for collab_id in story.get("collaborators", [])
        ]

        return CollaboratorResponse(
            success=True,
            message="Collaborator removed successfully",
            story_id=story_id,
            collaborator_ids=collaborator_ids,
        )
    except HTTPException as e:
        # Re-raise the HTTP exception
        raise e
    except Exception as e:
        # Handle any other exceptions
        raise HTTPException(
            status_code=500, detail=f"Failed to remove collaborator: {str(e)}"
        )


@router.delete(
    "/stories/{story_id}/collaborators/email", response_model=CollaboratorResponse
)
async def remove_story_collaborator_by_email(
    story_id: str, request: CollaboratorEmailRequest
):
    """
    Remove a collaborator from a story by email
    """
    try:
        story = await remove_collaborator_by_email(
            story_id, request.user_id, request.email
        )

        # Extract collaborator IDs and convert to strings for response
        collaborator_ids = [
            str(collab_id) for collab_id in story.get("collaborators", [])
        ]

        return CollaboratorResponse(
            success=True,
            message="Collaborator removed successfully",
            story_id=story_id,
            collaborator_ids=collaborator_ids,
        )
    except HTTPException as e:
        # Re-raise the HTTP exception
        raise e
    except Exception as e:
        # Handle any other exceptions
        raise HTTPException(
            status_code=500, detail=f"Failed to remove collaborator: {str(e)}"
        )


@router.get("/stories/{story_id}/collaborators")
async def list_story_collaborators(
    story_id: str,
    user_id: str = Query(..., description="ID of the user making the request"),
):
    """
    Get all collaborators for a story
    """
    try:
        # First check if user has access to the story
        has_access = await check_access(story_id, user_id)
        if not has_access:
            raise HTTPException(
                status_code=403, detail="You don't have access to this story"
            )

        # Get collaborators
        collaborators = await get_collaborators(story_id)

        return {"success": True, "story_id": story_id, "collaborators": collaborators}
    except HTTPException as e:
        # Re-raise the HTTP exception
        raise e
    except Exception as e:
        # Handle any other exceptions
        raise HTTPException(
            status_code=500, detail=f"Failed to get collaborators: {str(e)}"
        )


@router.get("/stories/{story_id}/access")
async def check_story_access(
    story_id: str, user_id: str = Query(...)
) -> Dict[str, Union[bool, str]]:
    """
    Check if a user has access to a story (either as author or collaborator)
    """
    try:
        # Convert string IDs to ObjectId
        story_oid = ObjectId(story_id)
        user_oid = ObjectId(user_id)
        user_str = str(user_oid)  # Convert user_id to string for comparison

        # Find the story
        story = await stories.find_one({"story_id": story_oid})
        if not story:
            return {"has_access": False, "reason": "Story not found"}

        # Check if user is the author
        if story.get("author") == user_oid:
            return {"has_access": True, "role": "author"}

        # Check if user is a collaborator
        collaborators = story.get("collaborators", [])
        # Use string comparison for more reliable results
        for collab in collaborators:
            if str(collab) == user_str:
                return {"has_access": True, "role": "collaborator"}

        # If story is public, allow read access
        if story.get("privacy") == "public":
            return {"has_access": True, "role": "reader"}

        return {"has_access": False, "reason": "No access rights"}
    except Exception as e:
        print(f"Error checking story access: {e}")
        return {"has_access": False, "reason": str(e)}


@router.get("/stories/users/email/{email}")
async def find_user_by_email_endpoint(
    email: str,
):
    """
    Find a user by email (useful for adding collaborators)
    """
    try:
        user = await find_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {"success": True, "user": user}
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise e
    except Exception as e:
        # Handle any other exceptions
        raise HTTPException(status_code=500, detail=f"Failed to find user: {str(e)}")
