# app/main.py
from fastapi import FastAPI, Depends
from app.utils.dependencies import get_current_user
from app.routes.auth import auth_router

app = FastAPI()

# Include auth routes
app.include_router(auth_router, prefix="/auth", tags=["Auth"])

@app.get("/protected-route")
async def protected_route(user: dict = Depends(get_current_user)):
    return {"message": f"Hello, user with ID {user['sub']}!"}
