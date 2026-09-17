from pydantic import BaseModel, Field
from typing import Optional, List
import datetime

class VideoRenderRequest(BaseModel):
    title: Optional[str] = None
    topic: str
    script_id: Optional[int] = None
    script_text: Optional[str] = None
    voice_id: Optional[str] = "en-US-ChristopherNeural"
    gameplay_clip: Optional[str] = "minecraft_parkour.mp4"
    bg_music: Optional[str] = "minecraft_ambient.mp3"
    subtitle_style: Optional[str] = "yellow_glow"

class VideoJobResponse(BaseModel):
    id: int
    title: str
    topic: str
    niche_category: str
    status: str
    progress: int
    current_step: str
    script_id: Optional[int] = None
    voice_id: str
    audio_path: Optional[str] = None
    subtitles_path: Optional[str] = None
    video_path: Optional[str] = None
    thumbnail_path: Optional[str] = None
    gameplay_clip: str
    bg_music: str
    subtitle_style: str
    duration_sec: float
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_tags: Optional[str] = None
    scheduled_at: Optional[datetime.datetime] = None
    published_at: Optional[datetime.datetime] = None
    youtube_video_id: Optional[str] = None
    youtube_url: Optional[str] = None
    views_count: Optional[int] = 0
    likes_count: Optional[int] = 0
    comments_count: Optional[int] = 0
    last_analytics_sync: Optional[datetime.datetime] = None
    source_video_path: Optional[str] = None
    is_clipped: Optional[int] = 0
    error_message: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class BatchGenerateRequest(BaseModel):
    count: int = Field(10, ge=1, le=20, description="Number of shorts to generate in batch")
    niche_category: Optional[str] = "Minecraft Facts"
    voice_id: Optional[str] = "en-US-ChristopherNeural"
    auto_schedule: Optional[bool] = True
    start_time: Optional[str] = "09:00"
