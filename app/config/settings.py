from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017/storywriter"

    # External authentication service
    AUTH_SERVICE_URL: str = (
        "http://localhost:8001"  # Update with actual auth service URL
    )

    model_config = SettingsConfigDict(env_file=".env", extra="allow")


settings = Settings()
