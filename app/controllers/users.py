from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from jwt.exceptions import InvalidTokenError
from fastapi.security import OAuth2PasswordBearer

from app.models.user import User, UserInDB
from app.models.auth import TokenData

from app.config.config import *
from app.config.db import get_database

settings = get_settings()
db = get_database()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except InvalidTokenError:
        raise credentials_exception
    user = get_user(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_user(username: str | None) -> UserInDB | None:
    # users = db["users"]
    # print("sssssss", users)
    if username:
        # find user by username in mongodb
        user_dict = db.user.find_one({"username": username})
        print("userrrrrrrrrrrrrrrrrrrrrrr", user_dict)
        if user_dict:
            return UserInDB(**user_dict)
    return None
