import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Navarachna - Autonomous Technology Intelligence Platform"
    VERSION: str = "1.0.0"
    
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./navarachna.db")
    CYCLE_INTERVAL_MINUTES: int = int(os.getenv("CYCLE_INTERVAL_MINUTES", "30"))
    PUBLISH_SCORE_THRESHOLD: float = float(os.getenv("PUBLISH_SCORE_THRESHOLD", "70.0"))

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
