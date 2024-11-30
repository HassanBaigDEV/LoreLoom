# app/main.py
from fastapi import FastAPI, Depends, Query
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi.middleware.cors import CORSMiddleware
from app.routes import draft
from app.routes.plan import router as plan_router
from app.routes.draft import router as draft_router
import logging
from bson import ObjectId
from app.models.story import Story  # Import the Story class
from app.config.mongo import db  # Import the database connection

logging.basicConfig(level=logging.INFO)  # Set global log level to INFO


# from fastapi import BackgroundTasks
# from app.config.database import db
# from datetime import datetime

# password_resets_collection = db["password_resets"]

# async def cleanup_expired_tokens():
#     await password_resets_collection.delete_many(
#         {"expires_at": {"$lt": datetime.utcnow()}}
#     )


limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = limiter

# add cors configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include auth routes
# app.include_router(auth_router, prefix="/auth", tags=["Auth"])
# app.include_router(user_router, prefix="/user", tags=["User"])

app.include_router(plan_router, prefix="/plan", tags=["plan"])
app.include_router(draft_router, prefix="/draft", tags=["draft"])

stories = db["stories"]  # Define the stories collection


@app.post("/stories")
async def create_story(user_id: str, genre: str):
    story_id = ObjectId()
    print(user_id)

    story = Story(_id=story_id, author=ObjectId(user_id), genre=genre)

    await stories.insert_one(story.model_dump())
    # Add the story reference to the user object in the users collection
    users = db["users"]
    await users.update_one({"_id": ObjectId(user_id)}, {"$push": {"stories": story_id}})
    # Convert ObjectIds to strings before returning
    return {
        "story_id": str(story_id),
        "author": str(ObjectId(user_id)),
        "genre": genre
    }


@app.get("/healthcheck")
async def healthcheck():
    return {"status": "ok"}
