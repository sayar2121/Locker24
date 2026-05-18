from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Locker 24"
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    DATABASE_URL: str = "sqlite:///./locker24.db" # Default to SQLite for easy local dev, override in .env
    
    # Local Storage Configuration
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Firebase Settings
    FIREBASE_PROJECT_ID: Optional[str] = None
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Ensure upload directory exists
if not os.path.exists(settings.UPLOAD_DIR):
    os.makedirs(settings.UPLOAD_DIR)
