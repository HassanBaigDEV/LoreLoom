# app/auth/auth_router.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import EmailStr
from fastapi.security import OAuth2PasswordRequestForm
from app.auth.jwt_handler import (
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
)

from app.models.user import User, CreateUser
from app.utils.security import hash_password, verify_password
from app.config.database import db
from bson import ObjectId
from app.utils.email import *
from app.serializers.userSerializers import userEntity
from app.auth.jwt_handler import create_verification_token, decode_token


auth_router = APIRouter()

users_collection = db["users"]


@auth_router.post("/register")
async def register(user: CreateUser, request: Request):
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    user.hashed_password = hash_password(user.hashed_password)
    # user.role = "user"
    new_user = user.model_dump()
    new_user["_id"] = str(ObjectId())
    await users_collection.insert_one(new_user)

    access_token = create_access_token(data={"sub": new_user["_id"]})
    refresh_token = create_refresh_token(data={"sub": new_user["_id"]})
    # Generate verification token and send email
    verification_token = create_verification_token(data={"sub": new_user["_id"]})
    # # send_verification_email(user.email, verification_token)
    # if request.client:
    #     url = f"{request.url.scheme}://{request.client.host}:{request.url.port}/auth/verify-email?token={verification_token}"
    # else:
    #     # Provide a default URL or handle the error
    #     url = f"{request.url.scheme}://localhost:{request.url.port}/auth/verify-email?token={verification_token}"
    # await Email(
    #     userEntity(new_user), url, [EmailStr(user.email)]
    # ).sendVerificationCode()

    send_verification_email(user.email, verification_token)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user_id": new_user["_id"],
        "token_type": "bearer",
        "status_code": 201,
        "message": "Registration successful! Please check your email to verify your account.",
    }


@auth_router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await users_collection.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user["_id"]})
    refresh_token = create_refresh_token(data={"sub": user["_id"]})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user_id": user["_id"],
        "token_type": "bearer",
    }


@auth_router.post("/refresh")
async def refresh_token(refresh_token: str):
    payload = verify_refresh_token(refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create a new access token
    access_token = create_access_token(data={"sub": payload["sub"]})

    return {"access_token": access_token, "token_type": "bearer"}


@auth_router.get("/verifyemail/{token}")
async def verify_email(token: str):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token"
        )

    user_id = payload.get("sub")
    user = await users_collection.find_one({"_id": user_id})
    if not user or user.get("is_verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found or already verified",
        )

    # Mark the user as verified
    await users_collection.update_one({"_id": user_id}, {"$set": {"is_verified": True}})

    return {"message": "Email successfully verified!"}
