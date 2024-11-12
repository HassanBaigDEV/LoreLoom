# app/main.py
from fastapi import FastAPI, Depends
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi.middleware.cors import CORSMiddleware
from app.routes.plan import router as plan_router
import logging

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


@app.get("/healthcheck")
async def healthcheck():
    return {"status": "ok"}
