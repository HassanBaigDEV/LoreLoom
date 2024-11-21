from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017/storywriter"

    model_config = SettingsConfigDict(env_file=".env", extra="allow")


settings = Settings()
