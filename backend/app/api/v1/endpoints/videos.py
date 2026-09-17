import os
from pathlib import Path
import asyncio
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
import datetime
from typing import List, Optional
from app.core.config import settings
from app.core.database import get_db
from app.models.video import VideoJob, JobStatus
from app.models.channel import ChannelSettings
from app.models.schedule import ScheduleSlot
from app.schemas.video import VideoRenderRequest, VideoJobResponse
from app.services.tts_service import AVAILABLE_VOICES
from app.services.scheduler_service import pipeline_service
from app.services.youtube_service import youtube_service

router = APIRouter()

@router.get("/voices")
async def list_voices():
    """List available AI neural voices for voiceover narration"""
    return AVAILABLE_VOICES

@router.post("", response_model=VideoJobResponse)
async def create_video_job(
    payload: VideoRenderRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Create a new video generation job and launch the pipeline in background"""
    title = payload.title or payload.topic
    
    job = VideoJob(
        title=title,
        topic=payload.topic,
        script_id=payload.script_id,
        voice_id=payload.voice_id or "en-US-ChristopherNeural",
        gameplay_clip=payload.gameplay_clip or "minecraft_parkour.mp4",
        bg_music=payload.bg_music or "minecraft_ambient.mp3",
        subtitle_style=payload.subtitle_style or "yellow_glow",
        status=JobStatus.DRAFT.value,
        progress=5,
        current_step="Starting pipeline..."
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Launch background rendering pipeline
    background_tasks.add_task(pipeline_service.run_pipeline_for_job, job.id)

    return job

@router.get("", response_model=List[VideoJobResponse])
async def list_video_jobs(
    status: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    query = select(VideoJob)
    if status:
        query = query.where(VideoJob.status == status)
    query = query.order_by(VideoJob.id.desc()).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/sync-analytics")
async def sync_analytics(db: AsyncSession = Depends(get_db)):
    """Fetch live YouTube views, likes, and comment metrics for all published videos"""
    ch_res = await db.execute(select(ChannelSettings).limit(1))
    ch = ch_res.scalar_one_or_none()
    client_id = ch.youtube_client_id if ch and ch.youtube_client_id else None
    client_secret = ch.youtube_client_secret if ch and ch.youtube_client_secret else None
    refresh_token = ch.youtube_refresh_token if ch and ch.youtube_refresh_token else None

    query = select(VideoJob).where(VideoJob.youtube_video_id.isnot(None))
    res = await db.execute(query)
    jobs = res.scalars().all()

    if not jobs:
        return {"synced_count": 0, "message": "No published YouTube videos found to sync.", "stats": {}}

    video_ids = [j.youtube_video_id for j in jobs if j.youtube_video_id]
    stats_map = await youtube_service.get_videos_statistics(
        video_ids=video_ids,
        client_id=client_id,
        client_secret=client_secret,
        refresh_token=refresh_token
    )

    now = datetime.datetime.utcnow()
    synced_count = 0
    for job in jobs:
        if job.youtube_video_id in stats_map:
            s = stats_map[job.youtube_video_id]
            job.views_count = s.get("views", 0)
            job.likes_count = s.get("likes", 0)
            job.comments_count = s.get("comments", 0)
            job.last_analytics_sync = now
            synced_count += 1

    await db.commit()
    return {
        "success": True,
        "synced_count": synced_count,
        "timestamp": now.isoformat(),
        "stats": stats_map
    }

@router.get("/{video_id}", response_model=VideoJobResponse)
async def get_video_job(video_id: int, db: AsyncSession = Depends(get_db)):
    job = await db.get(VideoJob, video_id)
    if not job:
        raise HTTPException(status_code=404, detail="Video job not found")
    return job

@router.post("/{video_id}/publish")
async def publish_video(video_id: int, db: AsyncSession = Depends(get_db)):
    job = await db.get(VideoJob, video_id)
    if not job:
        raise HTTPException(status_code=404, detail="Video job not found")

    if job.status not in [JobStatus.READY.value, JobStatus.SCHEDULED.value, JobStatus.PUBLISHED.value]:
        raise HTTPException(status_code=400, detail="Video is not ready for publishing")

    # Fetch channel settings for credentials
    ch_res = await db.execute(select(ChannelSettings).limit(1))
    ch = ch_res.scalar_one_or_none()
    client_id = ch.youtube_client_id if ch and ch.youtube_client_id else None
    client_secret = ch.youtube_client_secret if ch and ch.youtube_client_secret else None
    refresh_token = ch.youtube_refresh_token if ch and ch.youtube_refresh_token else None
    privacy = ch.default_privacy if ch and ch.default_privacy else "public"

    res = await youtube_service.upload_short(
        video_path=job.video_path or "",
        title=job.seo_title or job.title,
        description=job.seo_description or "",
        tags=job.seo_tags or "minecraft, shorts",
        privacy_status=privacy,
        client_id=client_id,
        client_secret=client_secret,
        refresh_token=refresh_token
    )

    if not res.get("success"):
        raise HTTPException(
            status_code=400,
            detail=res.get("error", "YouTube upload failed. Check your YouTube credentials in Channel Settings.")
        )

    job.status = JobStatus.PUBLISHED.value
    job.youtube_video_id = res.get("video_id")
    job.youtube_url = res.get("url")
    job.published_at = datetime.datetime.utcnow()
    if ch:
        ch.youtube_connected = True
    await db.commit()
    await db.refresh(job)

    return {
        "status": "published",
        "job": job,
        "youtube": res
    }

@router.delete("/{video_id}")
async def delete_video_job(video_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a video job, clear schedule slot associations, and remove exported files"""
    job = await db.get(VideoJob, video_id)
    if not job:
        raise HTTPException(status_code=404, detail="Video job not found")

    # 1. Detach from any schedule slots
    await db.execute(
        update(ScheduleSlot)
        .where(ScheduleSlot.video_job_id == video_id)
        .values(video_job_id=None)
    )

    # 2. Safely remove generated files if they exist
    try:
        if job.video_path:
            v_file = settings.EXPORTS_DIR / job.video_path
            if v_file.exists():
                v_file.unlink(missing_ok=True)
        if job.audio_path:
            a_file = settings.AUDIO_DIR / job.audio_path
            if a_file.exists():
                a_file.unlink(missing_ok=True)
        if job.subtitles_path:
            s_file = Path(job.subtitles_path)
            if s_file.exists():
                s_file.unlink(missing_ok=True)
    except Exception as e:
        print(f"[Delete Video] Warning deleting files for job {video_id}: {e}")

    # 3. Delete database record
    await db.delete(job)
    await db.commit()

    return {"success": True, "message": f"Video #{video_id} deleted successfully"}

