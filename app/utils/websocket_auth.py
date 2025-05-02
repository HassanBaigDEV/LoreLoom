from fastapi import WebSocket, WebSocketDisconnect
from bson import ObjectId
from app.config.mongo import db
import json
from typing import Optional, Dict, Any

# Collection references
stories = db["stories"]


async def check_story_access(story_id: str, user_id: str) -> bool:
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
        try:
            story_oid = ObjectId(story_id)
            user_oid = ObjectId(user_id)
            user_str = str(user_oid)  # Convert to string for comparison
        except Exception as e:
            print(f"Error converting IDs to ObjectId: {e}")
            print(f"story_id: {story_id}, user_id: {user_id}")
            return False

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
        story_author = story.get("author")
        print(f"Story author: {story_author}, User: {user_oid}")
        if story_author == user_oid:
            print(f"User {user_id} is the author of story {story_id}")
            return True

        # Check if user is a collaborator
        collaborators = story.get("collaborators", [])
        print(f"Collaborators: {collaborators}")

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
        # Any error means no access
        print(f"Error checking story access: {e}")
        return False


async def validate_websocket_connection(
    websocket: WebSocket, story_id: str
) -> Optional[str]:
    """
    Validate a WebSocket connection for story access

    Args:
        websocket: The WebSocket connection
        story_id: ID of the story being accessed

    Returns:
        User ID if authorized, None if unauthorized
    """
    # Get authentication token from query parameters
    token = websocket.query_params.get("token")
    if not token:
        print("No token provided in WebSocket connection")
        return None

    # Extract user_id from token - support different token formats
    user_id = None

    # Case 1: Token is already a MongoDB ObjectId (simple case)
    if len(token) == 24 and all(c in "0123456789abcdef" for c in token):
        user_id = token

    # Case 2: Token might be a JWT or other complex token
    else:
        try:
            # Here you would normally decode a JWT token
            # For now, just use the token as-is if it's not a valid ObjectId
            print(f"Token is not a MongoDB ObjectId: {token}")
            user_id = token
        except Exception as e:
            print(f"Failed to process token: {e}")
            return None

    if not user_id:
        print("Could not extract user ID from token")
        return None

    print(f"Validating WebSocket connection: story_id={story_id}, user_id={user_id}")

    # Check if user has access to this story
    has_access = await check_story_access(story_id, user_id)
    if not has_access:
        print(f"Access denied for user {user_id} to story {story_id}")
        return None

    print(f"Access granted for user {user_id} to story {story_id}")
    return user_id


class WebSocketManager:
    """
    Manages WebSocket connections and message distribution for collaborative editing
    """

    def __init__(self):
        # Dictionary to store active connections per story
        # Format: {story_id: {client_id: websocket}}
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, story_id: str) -> Optional[str]:
        """
        Connect a WebSocket client and validate access

        Args:
            websocket: The WebSocket connection
            story_id: ID of the story

        Returns:
            Client ID if connection is successful, None otherwise
        """
        # Validate access permissions
        user_id = await validate_websocket_connection(websocket, story_id)
        if not user_id:
            await websocket.close(code=1008, reason="Unauthorized")
            return None

        # Generate a unique client ID (using user_id for now, could be more complex)
        client_id = user_id

        # Accept the connection
        await websocket.accept()

        # Store the connection
        if story_id not in self.active_connections:
            self.active_connections[story_id] = {}
        self.active_connections[story_id][client_id] = websocket

        return client_id

    def disconnect(self, story_id: str, client_id: str):
        """
        Disconnect a WebSocket client

        Args:
            story_id: ID of the story
            client_id: ID of the client to disconnect
        """
        if story_id in self.active_connections:
            if client_id in self.active_connections[story_id]:
                del self.active_connections[story_id][client_id]
            if not self.active_connections[story_id]:
                del self.active_connections[story_id]

    async def broadcast(
        self, story_id: str, message: Dict[str, Any], exclude: Optional[str] = None
    ):
        """
        Broadcast a message to all connected clients for a story

        Args:
            story_id: ID of the story
            message: Message to send
            exclude: Client ID to exclude from broadcast (typically the sender)
        """
        if story_id in self.active_connections:
            for client_id, connection in self.active_connections[story_id].items():
                if exclude is None or client_id != exclude:
                    try:
                        await connection.send_text(json.dumps(message))
                    except WebSocketDisconnect:
                        # Connection might have been closed
                        self.disconnect(story_id, client_id)
                    except Exception:
                        # Handle any other exceptions
                        self.disconnect(story_id, client_id)

    async def send_personal_message(
        self, message: Dict[str, Any], story_id: str, client_id: str
    ):
        """
        Send a message to a specific client

        Args:
            message: Message to send
            story_id: ID of the story
            client_id: ID of the client to send message to
        """
        if (
            story_id in self.active_connections
            and client_id in self.active_connections[story_id]
        ):
            try:
                await self.active_connections[story_id][client_id].send_text(
                    json.dumps(message)
                )
            except WebSocketDisconnect:
                # Connection might have been closed
                self.disconnect(story_id, client_id)
            except Exception:
                # Handle any other exceptions
                self.disconnect(story_id, client_id)


# Create a global instance for use throughout the application
websocket_manager = WebSocketManager()
