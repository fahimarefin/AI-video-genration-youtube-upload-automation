import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from app.core.database import Base

class ChannelSettings(Base):
    __tablename__ = "channel_settings"

    id = Column(Integer, primary_key=True, index=True)
    channel_name = Column(String(150), default="Terry's Minecraft Realm")
    niche = Column(String(100), default="Minecraft Facts & Secrets")
    target_daily_videos = Column(Integer, default=10)
    default_privacy = Column(String(50), default="public") # public, unlisted, private
    auto_publish = Column(Boolean, default=False)
    default_tags = Column(String(500), default="minecraft, minecraft shorts, gaming, minecraft facts, shorts, minecraft glitches")
    default_description_footer = Column(Text, default="Subscribe for daily high-octane Minecraft secrets and crazy facts!\n#shorts #minecraft #gaming")
    youtube_connected = Column(Boolean, default=False)
    youtube_channel_id = Column(String(100), nullable=True)
    youtube_client_id = Column(String(255), nullable=True)
    youtube_client_secret = Column(String(255), nullable=True)
    youtube_refresh_token = Column(Text, nullable=True)
    subscriber_count = Column(Integer, default=1240)
    total_views = Column(Integer, default=48920)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class MediaAsset(Base):
    __tablename__ = "media_assets"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    asset_type = Column(String(50), nullable=False) # gameplay, music, sfx
    file_path = Column(String(500), nullable=False)
    duration_sec = Column(Integer, default=60)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
