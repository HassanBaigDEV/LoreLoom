from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from app.config.config import *
from app.models.user import User
from app.controllers.users import get_user
from app.utils.security import verify_password

# def create_access_token(data: dict):
#     to_encode = data.copy()
#     expire = datetime.now() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
#     to_encode.update({"exp": expire})
#     encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
#     return encoded_jwt

# def verify_access_token(token: str):
#     try:
#         payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
#         return payload
#     except JWTError:
#         return None

settings = get_settings()

def authenticate_user(db, username: str, password: str):
    user = get_user(username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    print(encoded_jwt)
    return encoded_jwt
