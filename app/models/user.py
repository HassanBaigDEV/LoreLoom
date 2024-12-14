# app/auth/models.py
from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional
from enum import Enum
from datetime import datetime


class Role(str, Enum):
    ADMIN = "admin"
    USER = "user"


class User(BaseModel):
    first_name: str
    last_name: str
    username: str
    email: EmailStr
    # hashed_password: str
    is_active: bool = True
    is_verified: bool = False
    photo: Optional[str] = None
    role: Role = Role.USER
    stories: Optional[list] = []
    bio: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class UserResponse(User):
    id: str
    pass


class CreateUser(User):
    password: str
    pass


class UpdateUserRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    photo: Optional[str] = None
