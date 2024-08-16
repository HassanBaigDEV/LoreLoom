# app/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from app.auth.jwt_handler import verify_token
from app.config.settings import oauth2_scheme


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # payload = decode_token(token)
        payload = verify_token(token)
        if not payload:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return (
        payload  # Return the user payload (e.g., user_id) for further use in the route
    )


async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    if current_user["is_active"]:
        return current_user
    raise HTTPException(status_code=400, detail="Inactive user")


async def get_current_verified_user(current_user: dict = Depends(get_current_user)):
    if current_user["is_verified"] and current_user["is_active"]:
        return current_user
    raise HTTPException(status_code=400, detail="Unverified user")
