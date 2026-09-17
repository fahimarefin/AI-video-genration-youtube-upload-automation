import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Enum as SQLEnum
import enum
from app.core.database import Base

class JobStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SCRIPTING = "SCRIPTING"
    VOICEOVER = "VOICEOVER"
    COMPOSING = "COMPOSING"
    READY = "READY"
    SCHEDULED = "SCHEDULED"
    PUBLISHED = "PUBLISHED"
    FAILED = "FAILED"

class Script(Base):
    __tablename__ = "scripts"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String(255), nullable=False)
    niche_category = Column(String(100), default="Minecraft Facts")
    hook = Column(Text, nullable=False)
    body = Column(Text, nullable=False)
    cta = Column(Text, nullable=False)
    full_text = Column(Text, nullable=False)
    word_count = Column(Integer, default=0)
    estimated_duration_sec = Column(Integer, default=45)
    voice_id = Column(String(100), default="en-US-ChristopherNeural")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class VideoJob(Base):
    __tablename__ = "video_jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    topic = Column(String(255), nullable=False)
    niche_category = Column(String(100), default="Minecraft")
    status = Column(String(50), default=JobStatus.DRAFT.value)
    progress = Column(Integer, default=0) # 0 to 100%
    current_step = Column(String(100), default="Initialized")
    
    script_id = Column(Integer, nullable=True)
    voice_id = Column(String(100), default="en-US-ChristopherNeural")
    
    audio_path = Column(String(500), nullable=True)
    subtitles_path = Column(String(500), nullable=True)
    video_path = Column(String(500), nullable=True)
    thumbnail_path = Column(String(500), nullable=True)
    
    gameplay_clip = Column(String(255), default="parkour_01.mp4")
    bg_music = Column(String(255), default="chill_c418.mp3")
    subtitle_style = Column(String(50), default="yellow_glow")
    
    duration_sec = Column(Float, default=0.0)
    
    # SEO
    seo_title = Column(String(255), nullable=True)
    seo_description = Column(Text, nullable=True)
    seo_tags = Column(String(500), nullable=True)
    
    # Scheduling & YouTube
    scheduled_at = Column(DateTime, nullable=True)
    published_at = Column(DateTime, nullable=True)
    youtube_video_id = Column(String(100), nullable=True)
    youtube_url = Column(String(255), nullable=True)
    
    # Performance Tracking & Analytics
    views_count = Column(Integer, default=0)
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    last_analytics_sync = Column(DateTime, nullable=True)

    # Long-Form Clip Repurposing
    source_video_path = Column(String(500), nullable=True)
    is_clipped = Column(Integer, default=0) # 1 if created from long-form clip

    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

