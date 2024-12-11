from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from fastapi.security import OAuth2PasswordBearer


class Settings(BaseSettings):
    MONGO_URI: str
    # JWT_SECRET: str
    SECRET_KEY: str
    ALGORITHM: str
    # JWT_ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_MINUTES: int

    MAILTRAP_USERNAME: str
    MAILTRAP_PASSWORD: str
    MAILTRAP_SMTP_SERVER: str
    MAILTRAP_PORT: int
    EMAIL_FROM: str
    EMAIL_VERIFICATION_URL: str
    PASSWORD_RESET_URL: str
    STRIPE_SECRET_KEY: str
    STRIPE_PUBLISHABLE_KEY: str
    STRIPE_WEBHOOK_SECRET: str
    STRIPE_BASIC_PRICE_ID: str
    STRIPE_PREMIUM_PRICE_ID: str
    FRONTEND_URL: str
    # allow extra fields
    model_config = SettingsConfigDict(env_file=".env", extra="allow")


@lru_cache
def get_settings():
    return Settings()  # type: ignore


settings = get_settings()


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
