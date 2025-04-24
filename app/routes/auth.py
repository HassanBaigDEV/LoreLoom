# app/auth/auth_router.py
from fastapi import APIRouter, Depends, Response, HTTPException, status, Request
from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.utils.dependencies import get_current_user


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
from app.models.auth import ResetPasswordRequest
from app.auth.jwt_handler import (
    create_verification_token,
    decode_token,
    create_password_reset_token,
)

# from app.app import limiter
from app.config.settings import oauth2_scheme
from app.models.auth import LoginModel, TokenResponse


auth_router = APIRouter()

users_collection = db["users"]
password_resets_collection = db["password_resets"]
blacklisted_tokens_collection = db["blacklisted_tokens"]


@auth_router.post("/register")
async def register(user: CreateUser, request: Request):
    if not user.email:
        raise HTTPException(status_code=400, detail="Email is required")
    if not user.password:
        raise HTTPException(status_code=400, detail="Password is required")
    if not user.first_name:
        raise HTTPException(status_code=400, detail="First name is required")
    if not user.last_name:
        raise HTTPException(status_code=400, detail="Last name is required")
    if not user.username:
        raise HTTPException(status_code=400, detail="Username is required")
    existing_username = await users_collection.find_one({"username": user.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already exists")
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    user.password = hash_password(user.password)
    # user.role = "user"
    new_user = user.model_dump()

    new_user["created_at"] = datetime.now()
    new_user["updated_at"] = datetime.now()

    # await users_collection.insert_one(new_user)
    result = await users_collection.insert_one(new_user)
    new_user["_id"] = str(result.inserted_id)  # Convert ObjectId to string if needed

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


@auth_router.post("/login", response_model=TokenResponse)
async def login(form_data: LoginModel):
    if not form_data.username:
        raise HTTPException(status_code=400, detail="Email is required")
    if not form_data.password:
        raise HTTPException(status_code=400, detail="Password is required")

    print(form_data.username)
    user = await users_collection.find_one({"email": form_data.username})
    print(user)
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user["_id"]})
    refresh_token = create_refresh_token(data={"sub": user["_id"]})

    return TokenResponse(accessToken=access_token, refreshToken=refresh_token)
    # return {
    #     "access_token": access_token,
    #     "refresh_token": refresh_token,
    #     "user_id": user["_id"],
    #     "token_type": "bearer",
    # }


# @auth_router.post("/login")
# async def login(form_data: OAuth2PasswordRequestForm = Depends()):
#     print(form_data.username)
#     user = await users_collection.find_one({"email": form_data.username})
#     if not user or not verify_password(form_data.password, user["password"]):
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid credentials",
#             headers={"WWW-Authenticate": "Bearer"},
#         )

#     access_token = create_access_token(data={"sub": user["_id"]})
#     refresh_token = create_refresh_token(data={"sub": user["_id"]})

#     # return TokenResponse(accessToken=access_token, refreshToken=refresh_token)
#     return {
#         "access_token": access_token,
#         "refresh_token": refresh_token,
#         "user_id": user["_id"],
#         "token_type": "bearer",
#     }


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
    refresh_token = create_refresh_token(data={"sub": payload["sub"]})

    return {"access_token": access_token, "refresh_token": refresh_token}


@auth_router.get("/verifyemail/{token}")
async def verify_email(token: str):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token"
        )

    user_id = payload.get("sub")
    # Convert string user_id back to ObjectId for MongoDB query
    try:
        user_id_obj = ObjectId(user_id)
        user = await users_collection.find_one({"_id": user_id_obj})
        if not user or user.get("is_verified"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User not found or already verified",
            )

        # Mark the user as verified
        await users_collection.update_one(
            {"_id": user_id_obj}, {"$set": {"is_verified": True}}
        )

        return {"message": "Email successfully verified!"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid user ID format: {str(e)}",
        )


@auth_router.post("/request-password-reset")
# @limiter.limit("5/minute")
async def request_password_reset(email: str):
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    reset_token = await create_password_reset_token(user["_id"])
    send_password_reset_email(email, reset_token)

    return {"message": "Password reset email sent! Please check your inbox."}


@auth_router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    token_entry = await password_resets_collection.find_one({"token": request.token})
    if not token_entry or token_entry["used"]:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    if datetime.now() > token_entry["expires_at"]:
        raise HTTPException(status_code=400, detail="Token has expired")

    user_id = token_entry["user_id"]
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    hashed_password = hash_password(request.new_password)
    await users_collection.update_one(
        {"_id": ObjectId(user_id)}, {"$set": {"hashed_password": hashed_password}}
    )

    # Mark token as used
    await password_resets_collection.update_one(
        {"token": request.token}, {"$set": {"used": True}}
    )

    return {"message": "Password successfully reset!"}


@auth_router.post("/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    # Blacklist the refresh token (and optionally the access token)
    await blacklisted_tokens_collection.insert_one(
        {"token": token, "blacklisted_at": datetime.now()}
    )

    return {"message": "Successfully logged out"}


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@auth_router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest, current_user: dict = Depends(get_current_user)
):
    try:
        # Decode token directly
        # decoded_token = decode_token(token)
        user_id = current_user["sub"]

        # Convert string user_id to ObjectId if needed
        try:
            if not isinstance(user_id, ObjectId):
                user_id_obj = ObjectId(user_id)
            else:
                user_id_obj = user_id
        except Exception as e:
            raise HTTPException(
                status_code=400, detail=f"Invalid user ID format: {str(e)}"
            )

        # Get user from database
        user = await users_collection.find_one({"_id": user_id_obj})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Verify current password
        if not verify_password(request.current_password, user["password"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        # Hash and update new password
        hashed_password = hash_password(request.new_password)
        await users_collection.update_one(
            {"_id": user_id_obj},
            {"$set": {"password": hashed_password, "updated_at": datetime.now()}},
        )

        return {"message": "Password successfully changed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
