from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class LoginModel(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    accessToken: str
    refreshToken: str
