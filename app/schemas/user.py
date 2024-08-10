from datetime import datetime
from typing import List
from pydantic import StringConstraints, ConfigDict, BaseModel, EmailStr
from bson.objectid import ObjectId
from typing_extensions import Annotated


class UserBaseSchema(BaseModel):
    name: str
    email: str
    photo: str
    role: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)


class CreateUserSchema(UserBaseSchema):
    password: Annotated[str, StringConstraints(min_length=8)]
    passwordConfirm: str
    verified: bool = False


class LoginUserSchema(BaseModel):
    email: EmailStr
    password: Annotated[str, StringConstraints(min_length=8)]


class UserResponseSchema(UserBaseSchema):
    id: str
    pass


class UserResponse(BaseModel):
    status: str
    user: UserResponseSchema


class FilteredUserResponse(UserBaseSchema):
    id: str

