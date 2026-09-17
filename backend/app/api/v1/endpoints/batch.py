from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db
from app.schemas.video import BatchGenerateRequest
from app.services.scheduler_service import pipeline_service

router = APIRouter()

@router.post("/generate")
async def start_batch_generation(payload: BatchGenerateRequest):
    """
    Triggers high-frequency generation of multiple Shorts (e.g. 10/day requirement).
    Spawns background tasks for all topics simultaneously.
    """
    count = min(max(1, payload.count), 20)
    voice_id = payload.voice_id or "en-US-ChristopherNeural"

    job_ids = await pipeline_service.trigger_batch_generation(count=count, voice_id=voice_id)

    return {
        "success": True,
        "message": f"Started automated batch generation for {len(job_ids)} Minecraft Shorts",
        "job_ids": job_ids,
        "target_algorithm_frequency": f"{count} videos/day"
    }
