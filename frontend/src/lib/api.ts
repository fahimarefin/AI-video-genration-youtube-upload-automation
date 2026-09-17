import {
  VideoJob,
  Script,
  ChannelStats,
  ChannelSettings,
  ScheduleSlot,
  MediaAsset,
  VoiceOption,
  YouTubeStatusResponse,
  ClippedMoment,
  AnalyzeResponse,
  MediaSourceItem,
  SyncAnalyticsResponse
} from "./types";

const API_BASE = "/api/v1";

export async function fetchStats(): Promise<ChannelStats> {
  const res = await fetch(`${API_BASE}/channel/stats`);
  if (!res.ok) throw new Error("Failed to fetch channel stats");
  return res.json();
}

export async function fetchVideos(status?: string): Promise<VideoJob[]> {
  const url = status ? `${API_BASE}/videos?status=${status}` : `${API_BASE}/videos`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch videos");
  return res.json();
}

export async function fetchVideo(id: number): Promise<VideoJob> {
  const res = await fetch(`${API_BASE}/videos/${id}`);
  if (!res.ok) throw new Error("Failed to fetch video details");
  return res.json();
}

export async function createVideoJob(payload: {
  topic: string;
  title?: string;
  script_id?: number;
  voice_id?: string;
  gameplay_clip?: string;
  bg_music?: string;
  subtitle_style?: string;
}): Promise<VideoJob> {
  const res = await fetch(`${API_BASE}/videos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create video job");
  return res.json();
}

export async function publishVideo(id: number): Promise<any> {
  const res = await fetch(`${API_BASE}/videos/${id}/publish`, {
    method: "POST",
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || "Failed to publish video to YouTube");
  }
  return res.json();
}

export async function deleteVideo(id: number): Promise<any> {
  const res = await fetch(`${API_BASE}/videos/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete video");
  return res.json();
}

export async function generateScript(params: {
  topic?: string;
  niche_category?: string;
  target_duration_sec?: number;
  voice_id?: string;
  previous_text?: string;
  tone?: string;
  custom_instruction?: string;
}): Promise<Script> {
  const res = await fetch(`${API_BASE}/scripts/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to generate script");
  return res.json();
}

export async function refineScript(params: {
  script_id?: number;
  topic: string;
  hook: string;
  body: string;
  cta: string;
  action: "regenerate" | "rewrite_hook" | "rewrite_body" | "rewrite_cta" | "change_tone" | "custom";
  tone?: string;
  instruction?: string;
  voice_id?: string;
  niche_category?: string;
}): Promise<Script> {
  const res = await fetch(`${API_BASE}/scripts/refine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to refine script with AI");
  return res.json();
}

export async function fetchPresetTopics(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/scripts/presets`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchVoices(): Promise<VoiceOption[]> {
  const res = await fetch(`${API_BASE}/videos/voices`);
  if (!res.ok) return [];
  return res.json();
}

export async function triggerBatch(count: number = 10, voice_id?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/batch/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count, voice_id }),
  });
  if (!res.ok) throw new Error("Failed to trigger batch generation");
  return res.json();
}

export async function fetchScheduleSlots(): Promise<ScheduleSlot[]> {
  const res = await fetch(`${API_BASE}/schedule/slots`);
  if (!res.ok) throw new Error("Failed to fetch schedule slots");
  return res.json();
}

export async function assignSlot(slotId: number, videoJobId: number): Promise<any> {
  const res = await fetch(`${API_BASE}/schedule/slots/${slotId}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ video_job_id: videoJobId }),
  });
  if (!res.ok) throw new Error("Failed to assign slot");
  return res.json();
}

export async function autoSchedule(): Promise<any> {
  const res = await fetch(`${API_BASE}/schedule/auto-schedule`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to auto schedule");
  return res.json();
}

export async function fetchChannelSettings(): Promise<ChannelSettings> {
  const res = await fetch(`${API_BASE}/channel/settings`);
  if (!res.ok) throw new Error("Failed to fetch channel settings");
  return res.json();
}

export async function updateChannelSettings(data: Partial<ChannelSettings>): Promise<ChannelSettings> {
  const res = await fetch(`${API_BASE}/channel/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update channel settings");
  return res.json();
}

export async function fetchMediaAssets(asset_type: string = "gameplay"): Promise<MediaAsset[]> {
  const res = await fetch(`${API_BASE}/media?asset_type=${asset_type}`);
  if (!res.ok) throw new Error("Failed to fetch media assets");
  return res.json();
}

export async function fetchYouTubeStatus(): Promise<YouTubeStatusResponse> {
  const res = await fetch(`${API_BASE}/channel/youtube/status`);
  if (!res.ok) throw new Error("Failed to fetch YouTube status");
  return res.json();
}

export async function testYouTubeCredentials(params: {
  client_id?: string;
  client_secret?: string;
  refresh_token?: string;
}): Promise<YouTubeStatusResponse> {
  const res = await fetch(`${API_BASE}/channel/youtube/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to test YouTube credentials");
  }
  return res.json();
}

export async function saveYouTubeCredentials(params: {
  client_id?: string;
  client_secret?: string;
  refresh_token?: string;
}): Promise<ChannelSettings> {
  const res = await fetch(`${API_BASE}/channel/youtube/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to save YouTube credentials");
  }
  return res.json();
}

export async function syncVideoAnalytics(): Promise<SyncAnalyticsResponse> {
  const res = await fetch(`${API_BASE}/videos/sync-analytics`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to sync YouTube analytics");
  }
  return res.json();
}

export async function fetchClipperSources(): Promise<MediaSourceItem[]> {
  const res = await fetch(`${API_BASE}/clipper/sources`);
  if (!res.ok) throw new Error("Failed to fetch available video sources");
  return res.json();
}

export async function uploadVideoForClipping(file: File): Promise<MediaSourceItem> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/clipper/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to upload video for clipping");
  }
  return res.json();
}

export async function analyzeVideoMoments(params: {
  video_path: string;
  target_clips?: number;
  min_duration?: number;
  max_duration?: number;
  num_moments?: number;
}): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE}/clipper/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      video_path: params.video_path,
      target_clips: params.target_clips || params.num_moments || 3
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to analyze video moments with AI");
  }
  return res.json();
}

export async function createClip(payload: {
  video_path: string;
  start_sec: number;
  end_sec: number;
  title?: string;
  hook?: string;
  subtitle_style?: string;
  reframe_mode?: "center_crop" | "blur_background";
}): Promise<VideoJob> {
  const res = await fetch(`${API_BASE}/clipper/create-clip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate 9:16 clip");
  }
  return res.json();
}

export async function createAllClips(payload: {
  video_path: string;
  moments: ClippedMoment[];
  subtitle_style?: string;
  reframe_mode?: "center_crop" | "blur_background";
}): Promise<{ total_created: number; jobs: VideoJob[] }> {
  const res = await fetch(`${API_BASE}/clipper/create-all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to batch create clips");
  }
  return res.json();
}
