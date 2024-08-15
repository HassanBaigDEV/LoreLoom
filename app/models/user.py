from pydantic import BaseModel

class User(BaseModel):
    _id : str | None = None
    username: str
    email: str | None = None
    full_name: str | None = None
    disabled: bool | None = None


class UserInDB(User):
    hashed_password: str
