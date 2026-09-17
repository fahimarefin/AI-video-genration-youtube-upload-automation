import os
import shutil
import uuid
import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.models.video import VideoJob, JobStatus
from app.schemas.video import VideoJobResponse
from app.services.video_analyzer import video_analyzer
from app.services.video_clipper import video_clipper
from app.services.seo_service import seo_service

router = APIRouter()

class AnalyzeRequest(BaseModel):
    video_path: str
    target_clips: Optional[int] = Field(3, ge=1, le=10)

class CreateClipRequest(BaseModel):
    video_path: str
    start_sec: float
    end_sec: float
    title: Optional[str] = None
    hook: Optional[str] = None
    reframe_mode: Optional[str] = "center_crop" # center_crop or blur_background
    subtitle_style: Optional[str] = "yellow_glow"

class BatchCreateClipsRequest(BaseModel):
    video_path: str
    moments: List[Dict[str, Any]]
    reframe_mode: Optional[str] = "center_crop"
    subtitle_style: Optional[str] = "yellow_glow"

@router.get("/sources")
async def list_available_sources():
    """Lists uploaded or media vault videos available for analysis and clipping"""
    sources = []

    # Check uploads
    if settings.UPLOADS_DIR.exists():
        for f in settings.UPLOADS_DIR.glob("*.*"):
            if f.suffix.lower() in [".mp4", ".mov", ".mkv", ".webm"] and not f.name.startswith("temp_"):
                info = video_analyzer.get_video_info(str(f))
                sources.append({
                    "id": f"upload_{f.name}",
                    "name": f.name,
                    "folder": "uploads",
                    "path": f"uploads/{f.name}",
                    "full_path": str(f),
                    **info
                })

    # Check gameplay media vault
    if settings.GAMEPLAY_DIR.exists():
        for f in settings.GAMEPLAY_DIR.glob("*.mp4"):
            info = video_analyzer.get_video_info(str(f))
            sources.append({
                "id": f"gameplay_{f.name}",
                "name": f.name,
                "folder": "gameplay",
                "path": f"gameplay/{f.name}",
                "full_path": str(f),
                **info
            })

    return sources

@router.post("/upload")
async def upload_long_form_video(file: UploadFile = File(...)):
    """Uploads a long-form video file for AI analysis and clipping"""
    ext = Path(file.filename or "video.mp4").suffix.lower()
    if ext not in [".mp4", ".mov", ".mkv", ".webm"]:
        raise HTTPException(status_code=400, detail="Invalid video format. Supported: MP4, MOV, MKV, WebM")

    safe_name = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    save_path = settings.UPLOADS_DIR / safe_name
    settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    info = video_analyzer.get_video_info(str(save_path))
    return {
        "success": True,
        "filename": safe_name,
        "path": f"uploads/{safe_name}",
        "full_path": str(save_path),
        **info
    }

def resolve_source_path(video_path: str) -> Path:
    p = Path(video_path)
    if p.is_absolute() and p.exists():
        return p
    candidates = [
        settings.STORAGE_DIR / video_path,
        settings.GAMEPLAY_DIR / video_path,
        settings.UPLOADS_DIR / video_path,
        settings.GAMEPLAY_DIR / Path(video_path).name,
        settings.UPLOADS_DIR / Path(video_path).name,
        settings.STORAGE_DIR / Path(video_path).name,
    ]
    for c in candidates:
        if c.exists():
            return c
    raise HTTPException(status_code=404, detail=f"Source video not found: {video_path}")

@router.post("/analyze")
async def analyze_video_moments(payload: AnalyzeRequest):
    """
    Runs AI analysis on the selected video:
    extracts audio, generates timestamped Whisper transcript,
    and identifies top viral retention moments with virality scores.
    """
    target_path = resolve_source_path(payload.video_path)
    result = await video_analyzer.analyze_video(str(target_path), payload.target_clips or 3)
    result["source_video"] = payload.video_path
    result["duration_seconds"] = result.get("video_info", {}).get("duration_sec", 60.0)
    result["moments_count"] = len(result.get("moments", []))
    return result

@router.post("/create-clip", response_model=VideoJobResponse)
async def create_single_clip(payload: CreateClipRequest, db: AsyncSession = Depends(get_db)):
    """
    Extracts a moment from source video, reframes to 9:16 vertical (1080x1920),
    burns in animated subtitles, generates viral SEO metadata, and saves to VideoJob pipeline.
    """
    target_path = resolve_source_path(payload.video_path)

    # 1. Execute slicing & 9:16 re-framing
    clip_result = video_clipper.slice_and_reframe(
        source_video_path=str(target_path),
        start_sec=payload.start_sec,
        end_sec=payload.end_sec,
        reframe_mode=payload.reframe_mode or "center_crop",
        hook_text=payload.hook,
        subtitle_style=payload.subtitle_style or "yellow_glow"
    )

    # 2. Generate Click-Worthy SEO Metadata
    clip_title = payload.title or f"Viral Moment ({int(payload.start_sec)}s - {int(payload.end_sec)}s)"
    seo_data = await seo_service.generate_seo(
        topic=clip_title,
        hook=payload.hook or clip_title,
        niche_category="Minecraft Highlights"
    )

    # 3. Create VideoJob in READY status
    job = VideoJob(
        title=clip_title,
        topic=clip_title,
        niche_category="Highlights",
        status=JobStatus.READY.value,
        progress=100,
        current_step="Completed (AI Clipped)",
        voice_id="original_audio",
        gameplay_clip=target_path.name,
        bg_music="original_audio",
        subtitle_style=payload.subtitle_style or "yellow_glow",
        duration_sec=clip_result["duration_sec"],
        video_path=clip_result["output_filename"],
        thumbnail_path=clip_result.get("thumbnail_path"),
        seo_title=seo_data.get("title", clip_title),
        seo_description=seo_data.get("description", ""),
        seo_tags=seo_data.get("tags", "shorts, gaming, minecraft"),
        source_video_path=payload.video_path,
        is_clipped=1
    )

    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job

@router.post("/create-all")
async def batch_create_all_moments(payload: BatchCreateClipsRequest, db: AsyncSession = Depends(get_db)):
    """Batch processes and slices all detected viral moments into separate 9:16 vertical Shorts"""
    target_path = resolve_source_path(payload.video_path)

    created_jobs = []
    for moment in payload.moments:
        start_sec = float(moment.get("start_sec", 0.0))
        end_sec = float(moment.get("end_sec", start_sec + 30.0))
        title = moment.get("title", "Viral Highlight")
        hook = moment.get("hook", title)

        try:
            clip_res = video_clipper.slice_and_reframe(
                source_video_path=str(target_path),
                start_sec=start_sec,
                end_sec=end_sec,
                reframe_mode=payload.reframe_mode or "center_crop",
                hook_text=hook,
                subtitle_style=payload.subtitle_style or "yellow_glow"
            )

            seo_data = await seo_service.generate_seo(
                topic=title,
                hook=hook,
                niche_category="Highlights"
            )

            job = VideoJob(
                title=title,
                topic=title,
                niche_category="Highlights",
                status=JobStatus.READY.value,
                progress=100,
                current_step="Completed (AI Clipped)",
                voice_id="original_audio",
                gameplay_clip=target_path.name,
                bg_music="original_audio",
                subtitle_style=payload.subtitle_style or "yellow_glow",
                duration_sec=clip_res["duration_sec"],
                video_path=clip_res["output_filename"],
                thumbnail_path=clip_res.get("thumbnail_path"),
                seo_title=seo_data.get("title", title),
                seo_description=seo_data.get("description", ""),
                seo_tags=seo_data.get("tags", "shorts, gaming, viral"),
                source_video_path=payload.video_path,
                is_clipped=1
            )
            db.add(job)
            created_jobs.append(job)
        except Exception as e:
            print(f"[Clipper] Failed creating moment '{title}': {e}")

    await db.commit()
    for j in created_jobs:
        await db.refresh(j)

    return {
        "success": True,
        "count": len(created_jobs),
        "jobs": created_jobs
    }
