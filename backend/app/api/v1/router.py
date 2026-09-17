from fastapi import APIRouter
from app.api.v1.endpoints import (
    health, scripts, videos, batch, schedule, media, channel, clipper
)

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(scripts.router, prefix="/scripts", tags=["Scripts"])
api_router.include_router(videos.router, prefix="/videos", tags=["Videos"])
api_router.include_router(batch.router, prefix="/batch", tags=["Batch Automation"])
api_router.include_router(schedule.router, prefix="/schedule", tags=["24/7 Scheduling"])
api_router.include_router(media.router, prefix="/media", tags=["Media Assets"])
api_router.include_router(channel.router, prefix="/channel", tags=["Channel Settings"])
api_router.include_router(clipper.router, prefix="/clipper", tags=["AI Clipper & Repurposing"])
