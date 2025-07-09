from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "StudyFlow Intelligence Service"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",  # Frontend dev
        "http://localhost:5001",  # Backend dev
        "http://localhost:3000",  # Alternative frontend
    ]
    
    # Database URL (shared with Node.js backend)
    DATABASE_URL: str = "postgresql://studyflow_user:studyflow_pass@localhost:5432/studyflow_db"
    
    # Service Configuration
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # ML Model Settings
    MIN_DATA_POINTS: int = 5  # Minimum sessions before making predictions
    CONFIDENCE_THRESHOLD: float = 0.7
    
    # Spaced Repetition Tuning
    BASE_EASE_FACTOR: float = 2.5
    MIN_EASE_FACTOR: float = 1.3
    MAX_EASE_FACTOR: float = 3.0
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()