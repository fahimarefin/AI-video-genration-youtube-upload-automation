from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import datetime
from app.core.config import settings
from app.core.database import get_db
from app.models.channel import ChannelSettings
from app.models.video import VideoJob, JobStatus
from app.schemas.channel import ChannelSettingsResponse, ChannelSettingsUpdate, YouTubeTestRequest, YouTubeTestResponse
from app.services.youtube_service import youtube_service

router = APIRouter()

@router.get("/settings", response_model=ChannelSettingsResponse)
async def get_channel_settings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ChannelSettings).limit(1))
    ch = result.scalar_one_or_none()
    if not ch:
        ch = ChannelSettings(
            channel_name="Terry's Minecraft Realm",
            niche="Minecraft Facts & Secrets",
            target_daily_videos=10,
            default_privacy="public",
            auto_publish=False,
            default_tags="minecraft, minecraft shorts, gaming, minecraft facts, shorts, minecraft glitches",
            default_description_footer="Subscribe for daily high-octane Minecraft secrets and crazy facts!\n#shorts #minecraft #gaming",
            youtube_connected=True,
            subscriber_count=1240,
            total_views=48920
        )
        db.add(ch)
        await db.commit()
        await db.refresh(ch)
    return ch

@router.put("/settings", response_model=ChannelSettingsResponse)
async def update_channel_settings(payload: ChannelSettingsUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ChannelSettings).limit(1))
    ch = result.scalar_one_or_none()
    if not ch:
        raise HTTPException(status_code=404, detail="Settings not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(ch, field, value)

    await db.commit()
    await db.refresh(ch)
    return ch

@router.get("/youtube/status")
async def get_youtube_status(db: AsyncSession = Depends(get_db)):
    """Check live status of the YouTube connection"""
    result = await db.execute(select(ChannelSettings).limit(1))
    ch = result.scalar_one_or_none()
    
    cid = ch.youtube_client_id if ch and ch.youtube_client_id else settings.YOUTUBE_CLIENT_ID
    sec = ch.youtube_client_secret if ch and ch.youtube_client_secret else settings.YOUTUBE_CLIENT_SECRET
    tok = ch.youtube_refresh_token if ch and ch.youtube_refresh_token else settings.YOUTUBE_REFRESH_TOKEN

    test_res = await youtube_service.test_connection(cid, sec, tok)
    
    if test_res.get("connected") and ch:
        ch.youtube_connected = True
        if test_res.get("channel_id"):
            ch.youtube_channel_id = test_res.get("channel_id")
        if test_res.get("subscriber_count"):
            ch.subscriber_count = test_res.get("subscriber_count")
        if test_res.get("view_count"):
            ch.total_views = test_res.get("view_count")
        await db.commit()
        await db.refresh(ch)
    elif ch and not test_res.get("connected"):
        ch.youtube_connected = False
        await db.commit()

    return {
        "is_configured": bool(cid and sec and tok),
        "client_id_preview": f"{cid[:16]}..." if cid else None,
        "has_refresh_token": bool(tok),
        **test_res
    }

@router.post("/youtube/test", response_model=YouTubeTestResponse)
async def test_youtube_credentials(payload: YouTubeTestRequest, db: AsyncSession = Depends(get_db)):
    """Test specified or currently saved YouTube credentials"""
    result = await db.execute(select(ChannelSettings).limit(1))
    ch = result.scalar_one_or_none()

    cid = payload.client_id or (ch.youtube_client_id if ch and ch.youtube_client_id else settings.YOUTUBE_CLIENT_ID)
    sec = payload.client_secret or (ch.youtube_client_secret if ch and ch.youtube_client_secret else settings.YOUTUBE_CLIENT_SECRET)
    tok = payload.refresh_token or (ch.youtube_refresh_token if ch and ch.youtube_refresh_token else settings.YOUTUBE_REFRESH_TOKEN)

    return await youtube_service.test_connection(cid, sec, tok)

@router.post("/youtube/credentials", response_model=ChannelSettingsResponse)
async def update_youtube_credentials(payload: YouTubeTestRequest, db: AsyncSession = Depends(get_db)):
    """Save YouTube credentials directly to channel settings"""
    result = await db.execute(select(ChannelSettings).limit(1))
    ch = result.scalar_one_or_none()
    if not ch:
        raise HTTPException(status_code=404, detail="Settings not found")

    if payload.client_id is not None:
        ch.youtube_client_id = payload.client_id.strip()
    if payload.client_secret is not None:
        ch.youtube_client_secret = payload.client_secret.strip()
    if payload.refresh_token is not None:
        ch.youtube_refresh_token = payload.refresh_token.strip()

    # Test the newly updated credentials
    test_res = await youtube_service.test_connection(
        ch.youtube_client_id or settings.YOUTUBE_CLIENT_ID,
        ch.youtube_client_secret or settings.YOUTUBE_CLIENT_SECRET,
        ch.youtube_refresh_token or settings.YOUTUBE_REFRESH_TOKEN
    )

    if test_res.get("connected"):
        ch.youtube_connected = True
        if test_res.get("channel_id"):
            ch.youtube_channel_id = test_res.get("channel_id")
        if test_res.get("subscriber_count"):
            ch.subscriber_count = test_res.get("subscriber_count")
        if test_res.get("view_count"):
            ch.total_views = test_res.get("view_count")
        if test_res.get("channel_title") and "No YouTube Channel" not in test_res["channel_title"]:
            ch.channel_name = test_res.get("channel_title")
    else:
        ch.youtube_connected = False

    await db.commit()
    await db.refresh(ch)
    return ch

@router.get("/stats")
async def get_channel_stats(db: AsyncSession = Depends(get_db)):
    """Summary metrics for the dashboard command center"""
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    total_jobs = await db.scalar(select(func.count(VideoJob.id))) or 0
    ready_count = await db.scalar(select(func.count(VideoJob.id)).where(VideoJob.status == JobStatus.READY.value)) or 0
    published_count = await db.scalar(select(func.count(VideoJob.id)).where(VideoJob.status == JobStatus.PUBLISHED.value)) or 0
    scheduled_count = await db.scalar(select(func.count(VideoJob.id)).where(VideoJob.status == JobStatus.SCHEDULED.value)) or 0
    processing_count = await db.scalar(select(func.count(VideoJob.id)).where(VideoJob.status.in_([
        JobStatus.SCRIPTING.value, JobStatus.VOICEOVER.value, JobStatus.COMPOSING.value
    ]))) or 0

    # Videos created today
    today_created = await db.scalar(select(func.count(VideoJob.id)).where(VideoJob.created_at >= today_start)) or 0

    return {
        "target_daily_videos": 10,
        "today_created": today_created,
        "today_progress_pct": min(100, int((today_created / 10) * 100)),
        "ready_count": ready_count,
        "scheduled_count": scheduled_count,
        "published_count": published_count,
        "processing_count": processing_count,
        "total_library_count": total_jobs,
        "algorithm_status": "Aggressive 10/day posting cadence active"
    }
