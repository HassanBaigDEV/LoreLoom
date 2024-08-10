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


class PostBaseSchema(BaseModel):
    title: str
    content: str
    category: str
    image: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
    # TODO[pydantic]: The following keys were removed: `json_encoders`.
    # Check https://docs.pydantic.dev/dev-v2/migration/#changes-to-config for more information.
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True, json_encoders={ObjectId: str})


class CreatePostSchema(PostBaseSchema):
    user: ObjectId | None = None
    pass


class PostResponse(PostBaseSchema):
    id: str
    user: FilteredUserResponse
    created_at: datetime
    updated_at: datetime


class UpdatePostSchema(BaseModel):
    title: str | None = None
    content: str | None = None
    category: str | None = None
    image: str | None = None
    user: str | None = None
    # TODO[pydantic]: The following keys were removed: `json_encoders`.
    # Check https://docs.pydantic.dev/dev-v2/migration/#changes-to-config for more information.
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True, json_encoders={ObjectId: str})


class ListPostResponse(BaseModel):
    status: str
    results: int
    posts: List[PostResponse]
