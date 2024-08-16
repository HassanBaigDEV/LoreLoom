# app/auth/models.py
from pydantic import BaseModel, EmailStr
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
    role: Role = Role.USER


class CreateUser(User):
    hashed_password: str
    pass
