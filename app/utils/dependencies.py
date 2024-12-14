# app/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from app.auth.jwt_handler import verify_token as decode_token
from app.config.settings import oauth2_scheme
from app.models.user import Role, User
from typing import Union
from app.config.database import db

users_collection = db["users"]


async def get_current_user(
    token: str = Depends(oauth2_scheme),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # payload = decode_token(token)
        payload = await decode_token(token)
        if not payload:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return (
        payload  # Return the user payload (e.g., user_id) for further use in the route
    )


async def get_current_admin(token: str = Depends(oauth2_scheme)):
    try:
        print(token)
        payload = await decode_token(token)
        print(payload)
        # user_id = payload.get("sub")
        # print(user_id)
        if not payload:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication credentials",
            )

        # user = await users_collection.find_one({"_id": user_id})
        # if not user or user.get("role") != "admin":
        #     raise HTTPException(status_code=403, detail="Not an admin user")

        return payload
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
        )


async def get_current_active_admin(current_admin: dict = Depends(get_current_admin)):
    if current_admin["is_active"]:
        return current_admin
    raise HTTPException(status_code=400, detail="Inactive admin")


async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    if current_user["is_active"]:
        return current_user
    raise HTTPException(status_code=400, detail="Inactive user")


async def get_current_verified_user(current_user: dict = Depends(get_current_user)):
    if current_user["is_verified"] and current_user["is_active"]:
        return current_user
    raise HTTPException(status_code=400, detail="Unverified user")


def require_role(required_role: Role):
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have the required role to access this resource",
            )
        return current_user

    return role_checker


def require_roles(*required_roles: Role):
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have the required role to access this resource",
            )
        return current_user

    return role_checker
