import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Terry Harris YouTube Automation"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENV: str = os.getenv("ENV", "development")
    DEBUG: bool = True
    
    # Storage paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: Path = BASE_DIR / "storage"
    DATA_DIR: Path = BASE_DIR / "data"
    
    GAMEPLAY_DIR: Path = STORAGE_DIR / "gameplay"
    AUDIO_DIR: Path = STORAGE_DIR / "audio"
    EXPORTS_DIR: Path = STORAGE_DIR / "exports"
    SUBTITLES_DIR: Path = STORAGE_DIR / "subtitles"
    MUSIC_DIR: Path = STORAGE_DIR / "music"
    UPLOADS_DIR: Path = STORAGE_DIR / "uploads"
    CLIPS_DIR: Path = STORAGE_DIR / "clips"
    
    # Database
    DATABASE_URL: str = f"sqlite+aiosqlite:///{DATA_DIR / 'youtube_automation.db'}"
    
    # AI and External APIs (OpenAI powers Scripts, Voiceover TTS, and Viral SEO)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # YouTube Data API v3
    YOUTUBE_CLIENT_ID: str = os.getenv("YOUTUBE_CLIENT_ID", "")
    YOUTUBE_CLIENT_SECRET: str = os.getenv("YOUTUBE_CLIENT_SECRET", "")
    YOUTUBE_REFRESH_TOKEN: str = os.getenv("YOUTUBE_REFRESH_TOKEN", "")
    
    # Automation defaults
    DEFAULT_VOICE: str = "en-US-ChristopherNeural"
    TARGET_VIDEOS_PER_DAY: int = 10
    NICHE: str = "Minecraft"
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

# Ensure directories exist
for folder in [settings.STORAGE_DIR, settings.DATA_DIR, settings.GAMEPLAY_DIR, 
               settings.AUDIO_DIR, settings.EXPORTS_DIR, settings.SUBTITLES_DIR, settings.MUSIC_DIR,
               settings.UPLOADS_DIR, settings.CLIPS_DIR]:
    folder.mkdir(parents=True, exist_ok=True)

