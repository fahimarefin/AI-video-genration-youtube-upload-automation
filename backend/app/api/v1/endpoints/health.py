from fastapi import APIRouter
import shutil
from app.core.config import settings

router = APIRouter()

@router.get("")
async def healthcheck():
    has_ffmpeg = shutil.which("ffmpeg") is not None
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "niche": settings.NICHE,
        "ffmpeg_installed": has_ffmpeg,
        "target_videos_per_day": settings.TARGET_VIDEOS_PER_DAY
    }
