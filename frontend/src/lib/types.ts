export interface VideoJob {
  id: number;
  title: string;
  topic: string;
  niche_category: string;
  status: "DRAFT" | "SCRIPTING" | "VOICEOVER" | "COMPOSING" | "READY" | "SCHEDULED" | "PUBLISHED" | "FAILED";
  progress: number;
  current_step: string;
  script_id?: number;
  voice_id: string;
  audio_path?: string;
  subtitles_path?: string;
  video_path?: string;
  thumbnail_path?: string;
  gameplay_clip: string;
  bg_music: string;
  subtitle_style: string;
  duration_sec: number;
  seo_title?: string;
  seo_description?: string;
  seo_tags?: string;
  scheduled_at?: string;
  published_at?: string;
  youtube_video_id?: string;
  youtube_url?: string;
  views_count?: number;
  likes_count?: number;
  comments_count?: number;
  last_analytics_sync?: string;
  source_video_path?: string;
  is_clipped?: boolean;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface Script {
  id?: number;
  topic: string;
  niche_category: string;
  hook: string;
  body: string;
  cta: string;
  full_text: string;
  word_count: number;
  estimated_duration_sec: number;
  voice_id: string;
  tone?: string;
  created_at?: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: string;
  vibe: string;
}

export interface ScheduleSlot {
  id: number;
  slot_time: string;
  day_of_week: string;
  is_active: boolean;
  video_job_id?: number;
  last_run_at?: string;
}

export interface ChannelSettings {
  id: number;
  channel_name: string;
  niche: string;
  target_daily_videos: number;
  default_privacy: string;
  auto_publish: boolean;
  default_tags: string;
  default_description_footer: string;
  youtube_connected: boolean;
  youtube_channel_id?: string;
  youtube_client_id?: string;
  youtube_client_secret?: string;
  youtube_refresh_token?: string;
  subscriber_count: number;
  total_views: number;
}

export interface YouTubeStatusResponse {
  is_configured: boolean;
  client_id_preview?: string;
  has_refresh_token: boolean;
  connected: boolean;
  channel_id?: string;
  channel_title?: string;
  subscriber_count?: number;
  video_count?: number;
  view_count?: number;
  thumbnail?: string;
  error?: string;
}

export interface ChannelStats {
  target_daily_videos: number;
  today_created: number;
  today_progress_pct: number;
  ready_count: number;
  scheduled_count: number;
  published_count: number;
  processing_count: number;
  total_library_count: number;
  algorithm_status: string;
}

export interface MediaAsset {
  id: number;
  filename: string;
  title: string;
  asset_type: "gameplay" | "music" | "sfx";
  duration_sec: number;
  is_default: boolean;
  file_path: string;
}

export interface ClippedMoment {
  id?: string;
  title: string;
  hook?: string;
  start_sec?: number;
  end_sec?: number;
  duration?: number;
  virality_score: number;
  summary?: string;
  tags?: string;
  keywords?: string[];
  key_reason?: string;
  suggested_caption?: string;
  start_time?: number;
  end_time?: number;
}

export interface AnalyzeResponse {
  video_info?: {
    duration_sec?: number;
    width?: number;
    height?: number;
    file_size_mb?: number;
    filename?: string;
    path?: string;
  };
  transcript_summary?: string;
  total_moments_found?: number;
  moments: ClippedMoment[];
  source_video?: string;
  duration_seconds?: number;
  moments_count?: number;
}

export interface MediaSourceItem {
  id?: string;
  name: string;
  path: string;
  folder?: string;
  file_size_mb?: number;
  size_mb?: number;
  duration_sec?: number;
  duration_seconds?: number;
  width?: number;
  height?: number;
  aspect_ratio?: string;
  is_uploaded?: boolean;
}

export interface SyncAnalyticsResponse {
  success: boolean;
  synced_count: number;
  timestamp: string;
  stats: Record<string, { views: number; likes: number; comments: number }>;
}
