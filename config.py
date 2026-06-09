from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    bot_token: str
    api_base_url: str = "http://localhost:8000/api"
    api_key: str = "your-internal-api-key"
    support_username: str = "support"


settings = Settings()
