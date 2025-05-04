from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.utils.websocket_auth import websocket_manager
import json
from typing import Dict, Any
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.websocket("/ws/story/{story_id}")
async def websocket_endpoint(websocket: WebSocket, story_id: str):
    """
    WebSocket endpoint for real-time story collaboration

    This endpoint allows multiple users to collaborate on a story in real time.
    Authentication is required via a token query parameter which will be validated
    against the story access permissions.
    """
    # Connect the client and check permissions
    client_id = await websocket_manager.connect(websocket, story_id)

    # If client_id is None, the connection was rejected due to permissions
    if client_id is None:
        return

    try:
        # Send connection confirmation
        await websocket_manager.send_personal_message(
            {
                "type": "connection_established",
                "client_id": client_id,
                "story_id": story_id,
            },
            story_id,
            client_id,
        )

        # Notify other users that someone has joined
        await websocket_manager.broadcast(
            story_id,
            {"type": "user_joined", "client_id": client_id, "story_id": story_id},
            exclude=client_id,
        )

        # Handle incoming messages
        while True:
            data = await websocket.receive_text()
            try:
                # Parse the received data
                message_data = json.loads(data)

                # Add metadata to message
                message_data["client_id"] = client_id
                message_data["story_id"] = story_id

                # Handle different message types
                if message_data.get("type") == "content_update":
                    # Broadcast content changes to all other clients
                    await websocket_manager.broadcast(
                        story_id, message_data, exclude=client_id
                    )
                elif message_data.get("type") == "cursor_position":
                    # Broadcast cursor position to all other clients
                    await websocket_manager.broadcast(
                        story_id, message_data, exclude=client_id
                    )
                elif message_data.get("type") == "passage_lock":
                    # Broadcast passage lock to all other clients
                    await websocket_manager.broadcast(
                        story_id,
                        message_data,
                        exclude=None,  # Send to all clients including sender
                    )
                elif message_data.get("type") == "passage_unlock":
                    # Broadcast passage unlock to all other clients
                    await websocket_manager.broadcast(
                        story_id,
                        message_data,
                        exclude=None,  # Send to all clients including sender
                    )
                else:
                    # Broadcast other message types
                    await websocket_manager.broadcast(
                        story_id, message_data, exclude=client_id
                    )
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received from client {client_id}")
                continue
            except Exception as e:
                logger.error(f"Error processing message: {str(e)}")
                continue
    except WebSocketDisconnect:
        # Client disconnected
        websocket_manager.disconnect(story_id, client_id)

        # Notify other users that someone has left
        await websocket_manager.broadcast(
            story_id,
            {"type": "user_left", "client_id": client_id, "story_id": story_id},
        )
    except Exception as e:
        # Handle any other exceptions
        logger.error(f"WebSocket error: {str(e)}")
        websocket_manager.disconnect(story_id, client_id)

        # Notify other users if there was an error
        await websocket_manager.broadcast(
            story_id,
            {"type": "user_left", "client_id": client_id, "story_id": story_id},
        )
