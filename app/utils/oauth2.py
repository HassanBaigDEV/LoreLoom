import base64
from typing import List
from fastapi import Header, HTTPException, status, Depends
from authlib.jose import JsonWebToken, jwt
from pydantic import BaseModel
from bson.objectid import ObjectId
from authlib.jose import jwt

from app.serializers.userSerializers import userEntity

from ..config.database import User
from ..config.config import settings

private_key = base64.b64decode(settings.JWT_PRIVATE_KEY).decode("utf-8")
public_key = base64.b64decode(settings.JWT_PUBLIC_KEY).decode("utf-8")

jwt_algorithms = [settings.JWT_ALGORITHM]
jwt_instance = JsonWebToken(jwt_algorithms)


def create_jwt(user_id: str):
    header = {"alg": settings.JWT_ALGORITHM}
    payload = {"sub": str(user_id)}
    token = jwt.encode(header, payload, private_key)
    return token.decode("utf-8")


class NotVerified(Exception):
    pass


class UserNotFound(Exception):
    pass



def require_user(authorization: str = Header(None)) -> str:
    try:
        if not authorization:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="You are not logged in"
            )

        # Extract the token from the Authorization header
        token = authorization.split(" ")[1]

        # Decode the JWT and validate
        claims = jwt_instance.decode(token, public_key)
        claims.validate()  # Validates expiration and issued time

        user_id = claims.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
            )

        user = userEntity(User.find_one({"_id": ObjectId(user_id)}))

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer exists"
            )

        if not user["verified"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Please verify your account",
            )

    except Exception as e:
        error = e.__class__.__name__
        print(error)
        if error == "MissingTokenError":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="You are not logged in"
            )
        if error == "UserNotFound":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer exists"
            )
        if error == "NotVerified":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Please verify your account",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or has expired",
        )

    return user_id
