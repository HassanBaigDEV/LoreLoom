# app/main.py
from fastapi import FastAPI, Depends
from app.utils.dependencies import get_current_user
from app.routes.auth import auth_router
from app.routes.user import user_router
from app.routes.story import story_router
from app.routes.subscription import subscription_router
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi.middleware.cors import CORSMiddleware
from app.routes.admin import admin_router
from app.routes.feedback import feedback_router
from fastapi.staticfiles import StaticFiles
from pathlib import Path


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
# app.state.limiter = limiter

# add cors configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include auth routes
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(user_router, prefix="/user", tags=["User"])
app.include_router(story_router, prefix="/author", tags=["Author"])
app.include_router(subscription_router, prefix="/subscription", tags=["Subscription"])
app.include_router(admin_router, prefix="/admin", tags=["Admin"])
app.include_router(feedback_router, prefix="/api", tags=["Feedback"])

# No longer needed as we're using base64 encoding for images
# uploads_dir = Path("uploads")
# uploads_dir.mkdir(exist_ok=True)
# app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/protected-route")
async def protected_route(user: dict = Depends(get_current_user)):
    return {"message": f"Hello, user with ID {user['sub']}!"}
