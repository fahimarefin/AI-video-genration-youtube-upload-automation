from pydantic import BaseModel
from typing import Optional, List
import datetime

class ChannelSettingsResponse(BaseModel):
    id: int
    channel_name: str
    niche: str
    target_daily_videos: int
    default_privacy: str
    auto_publish: bool
    default_tags: str
    default_description_footer: str
    youtube_connected: bool
    youtube_channel_id: Optional[str] = None
    youtube_client_id: Optional[str] = None
    youtube_client_secret: Optional[str] = None
    youtube_refresh_token: Optional[str] = None
    subscriber_count: int
    total_views: int

    class Config:
        from_attributes = True

class ChannelSettingsUpdate(BaseModel):
    channel_name: Optional[str] = None
    niche: Optional[str] = None
    target_daily_videos: Optional[int] = None
    default_privacy: Optional[str] = None
    auto_publish: Optional[bool] = None
    default_tags: Optional[str] = None
    default_description_footer: Optional[str] = None
    youtube_client_id: Optional[str] = None
    youtube_client_secret: Optional[str] = None
    youtube_refresh_token: Optional[str] = None

class YouTubeTestRequest(BaseModel):
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    refresh_token: Optional[str] = None

class YouTubeTestResponse(BaseModel):
    connected: bool
    channel_id: Optional[str] = None
    channel_title: Optional[str] = None
    subscriber_count: Optional[int] = 0
    video_count: Optional[int] = 0
    view_count: Optional[int] = 0
    thumbnail: Optional[str] = None
    error: Optional[str] = None

class MediaAssetResponse(BaseModel):
    id: int
    filename: str
    title: str
    asset_type: str
    duration_sec: int
    is_default: bool
    file_path: str

    class Config:
        from_attributes = True
