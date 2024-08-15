from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Depends, APIRouter

from app.models.user import User

router = APIRouter()


@router.get("/me", response_model=User)
async def read_users_me(
):
    pass