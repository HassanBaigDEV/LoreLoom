from bson import ObjectId
from fastapi import HTTPException
from app.config.mongo import db
from typing import List, Optional

# Collection references
stories = db["stories"]
users = db["users"]


async def add_collaborator(story_id: str, user_id: str, collaborator_id: str) -> dict:
    """
    Add a collaborator to a story

    Args:
        story_id: ID of the story
        user_id: ID of the user making the request (must be the author)
        collaborator_id: ID of the user to add as collaborator

    Returns:
        Updated story document
    """
    # Convert string IDs to ObjectId
    story_oid = ObjectId(story_id)
    user_oid = ObjectId(user_id)
    collaborator_oid = ObjectId(collaborator_id)
    collaborator_str = str(collaborator_oid)  # String version for comparison

    # Check if story exists
    story = await stories.find_one({"story_id": story_oid})
    if not story:
        # Try with _id as fallback
        story = await stories.find_one({"story_id": story_oid})
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")

    # Check if requester is the author
    if story.get("author") != user_oid:
        raise HTTPException(
            status_code=403, detail="Only the author can add collaborators"
        )

    # Check if collaborator exists
    collaborator = await users.find_one({"_id": collaborator_oid})
    if not collaborator:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user is already a collaborator using string comparison
    collaborators = story.get("collaborators", [])
    for collab in collaborators:
        if str(collab) == collaborator_str:
            raise HTTPException(
                status_code=400, detail="User is already a collaborator"
            )

    # Use the appropriate identifier based on what was found
    story_identifier = (
        {"story_id": story_oid} if "story_id" in story else {"story_id": story_oid}
    )

    # Add collaborator to story
    result = await stories.update_one(
        story_identifier,
        {
            "$addToSet": {"collaborators": collaborator_oid},
            "$set": {"updated_at": ObjectId().generation_time},
        },
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to add collaborator")

    return await stories.find_one(story_identifier)


async def add_collaborator_by_email(story_id: str, user_id: str, email: str) -> dict:
    """
    Add a collaborator to a story by email

    Args:
        story_id: ID of the story
        user_id: ID of the user making the request (must be the author)
        email: Email of the user to add as collaborator

    Returns:
        Updated story document
    """
    # Convert string ID to ObjectId
    story_oid = ObjectId(story_id)
    user_oid = ObjectId(user_id)

    # Find user by email
    collaborator = await users.find_one({"email": email})
    if not collaborator:
        raise HTTPException(status_code=404, detail="User with this email not found")

    # Get collaborator ID
    collaborator_id = str(collaborator.get("_id"))

    # Add collaborator using existing function
    return await add_collaborator(story_id, user_id, collaborator_id)


async def remove_collaborator(
    story_id: str, user_id: str, collaborator_id: str
) -> dict:
    """
    Remove a collaborator from a story

    Args:
        story_id: ID of the story
        user_id: ID of the user making the request (must be the author)
        collaborator_id: ID of the user to remove as collaborator

    Returns:
        Updated story document
    """
    # Convert string IDs to ObjectId
    story_oid = ObjectId(story_id)
    user_oid = ObjectId(user_id)
    collaborator_oid = ObjectId(collaborator_id)

    # Check if story exists
    story = await stories.find_one({"story_id": story_oid})
    if not story:
        # Try with _id as fallback
        story = await stories.find_one({"story_id": story_oid})
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")

    # Check if requester is the author
    if story.get("author") != user_oid:
        raise HTTPException(
            status_code=403, detail="Only the author can remove collaborators"
        )

    # Use the appropriate identifier based on what was found
    story_identifier = (
        {"story_id": story_oid} if "story_id" in story else {"story_id": story_oid}
    )

    # Remove collaborator from story
    result = await stories.update_one(
        story_identifier,
        {
            "$pull": {"collaborators": collaborator_oid},
            "$set": {"updated_at": ObjectId().generation_time},
        },
    )

    if result.modified_count == 0:
        # User might not be a collaborator
        raise HTTPException(
            status_code=400, detail="User is not a collaborator or removal failed"
        )

    return await stories.find_one(story_identifier)


async def remove_collaborator_by_email(story_id: str, user_id: str, email: str) -> dict:
    """
    Remove a collaborator from a story by email

    Args:
        story_id: ID of the story
        user_id: ID of the user making the request (must be the author)
        email: Email of the user to remove as collaborator

    Returns:
        Updated story document
    """
    # Find user by email
    collaborator = await users.find_one({"email": email})
    if not collaborator:
        raise HTTPException(status_code=404, detail="User with this email not found")

    # Get collaborator ID
    collaborator_id = str(collaborator.get("_id"))

    # Remove collaborator using existing function
    return await remove_collaborator(story_id, user_id, collaborator_id)


def serialize_user(user: dict) -> dict:
    user["_id"] = str(user["_id"])
    return user


async def get_collaborators(story_id: str) -> List[dict]:
    """
    Get all collaborators for a story

    Args:
        story_id: ID of the story

    Returns:
        List of collaborator documents
    """
    # Convert string ID to ObjectId
    story_oid = ObjectId(story_id)

    # Check if story exists
    story = await stories.find_one({"story_id": story_oid})
    if not story:
        # Try with _id as fallback
        story = await stories.find_one({"story_id": story_oid})
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")

    # Get list of collaborator IDs
    collaborator_ids = story.get("collaborators", [])

    # Fetch collaborator documents
    collaborators = []
    for collab_id in collaborator_ids:
        user = await users.find_one({"_id": collab_id})
        if user:
            # Remove sensitive data
            user.pop("password", None)
            # Convert ObjectId to string
            collaborators.append(serialize_user(user))

    return collaborators


async def find_user_by_email(email: str) -> Optional[dict]:
    """
    Find a user by email

    Args:
        email: Email to search for

    Returns:
        User document if found, None otherwise
    """
    user = await users.find_one({"email": email})
    if user and "password" in user:
        del user["password"]  # Remove sensitive data
    return user


async def check_access(story_id: str, user_id: str) -> bool:
    """
    Check if a user has access to a story (either as author or collaborator)

    Args:
        story_id: ID of the story
        user_id: ID of the user

    Returns:
        True if access is allowed, False otherwise
    """
    try:
        # Convert string IDs to ObjectId
        story_oid = ObjectId(story_id)
        user_oid = ObjectId(user_id)
        user_str = str(user_oid)  # Convert to string for comparison

        # Find the story using story_id as the primary identifier
        # Note: stories in MongoDB use story_id field, not _id
        story = await stories.find_one({"story_id": story_oid})

        # If not found by story_id, try with _id as fallback
        if not story:
            story = await stories.find_one({"story_id": story_oid})

        if not story:
            print(f"Story not found with ID: {story_id}")
            return False

        # Check if user is the author
        if story.get("author") == user_oid:
            print(f"User {user_id} is the author of story {story_id}")
            return True

        # Check if user is a collaborator
        collaborators = story.get("collaborators", [])
        print(f"Checking if user {user_id} is in collaborators: {collaborators}")

        # Check if user is in collaborators list by comparing string values
        for collab in collaborators:
            collab_str = str(collab)
            if collab_str == user_str:
                print(f"User {user_id} is a collaborator for story {story_id}")
                return True

        # If we get here, user is not a collaborator
        print(f"User {user_id} is not a collaborator for story {story_id}")
        return False
    except Exception as e:
        print(f"Error checking access: {e}")
        return False
