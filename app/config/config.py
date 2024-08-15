from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    MONGO_URI : str
    JWT_SECRET: str 
    SECRET_KEY: str
    ALGORITHM: str
    # JWT_ALGORITHM: str 
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_MINUTES: int

    # allow extra fields
    model_config = SettingsConfigDict(env_file=".env", extra="allow")

@lru_cache
def get_settings():
    return Settings() # type: ignore

settings = get_settings()