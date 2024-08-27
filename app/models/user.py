# app/auth/models.py
from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional
from enum import Enum


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


class CreateUser(User):
    password: str
    pass
