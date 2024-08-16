# app/auth/jwt_handler.py
from datetime import datetime, timedelta
import uuid
from fastapi import HTTPException, Depends
from typing import Union
from jose import JWTError, jwt
from app.config.settings import settings, oauth2_scheme
from app.config.database import db


password_resets_collection = db["password_resets"]
blacklisted_tokens_collection = db["blacklisted_tokens"]
users_collection = db["users"]


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now() + timedelta(days=7)  # Refresh token valid for 7 days
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str):
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


async def verify_token(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Check if the token is blacklisted
    if await blacklisted_tokens_collection.find_one({"token": token}):
        raise HTTPException(status_code=401, detail="Token has been blacklisted")
    # Proceed with other checks (e.g., user existence, expiration)
    user_id = payload["sub"]
    user = await users_collection.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return payload


def verify_refresh_token(refresh_token: str):
    try:
        payload = jwt.decode(
            refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def create_verification_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now() + timedelta(minutes=20)  # Token valid for 24 hours
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def create_password_reset_token(user_id: str):
    token = str(uuid.uuid4())
    expiration = datetime.now() + timedelta(minutes=30)  # 1/2 hour expiration
    await password_resets_collection.insert_one(
        {"user_id": user_id, "token": token, "expires_at": expiration, "used": False}
    )
    return token
