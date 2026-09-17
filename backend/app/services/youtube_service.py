import os
from pathlib import Path
from typing import Dict, Any, Optional, List
import httpx
from app.core.config import settings

class YouTubeService:
    def __init__(self):
        self.client_id = settings.YOUTUBE_CLIENT_ID
        self.client_secret = settings.YOUTUBE_CLIENT_SECRET
        self.refresh_token = settings.YOUTUBE_REFRESH_TOKEN

    def is_configured(self, client_id: Optional[str] = None, client_secret: Optional[str] = None, refresh_token: Optional[str] = None) -> bool:
        cid = client_id or self.client_id
        sec = client_secret or self.client_secret
        tok = refresh_token or self.refresh_token
        return bool(cid and sec and tok)

    async def test_connection(
        self,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        refresh_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Tests the YouTube OAuth2 refresh token against Google OAuth endpoints
        and retrieves live channel info (title, subscribers, view count).
        """
        cid = client_id or self.client_id
        sec = client_secret or self.client_secret
        tok = refresh_token or self.refresh_token

        if not (cid and sec and tok):
            return {
                "connected": False,
                "error": "YouTube credentials not set. Please provide Client ID, Client Secret, and Refresh Token."
            }

        token_url = "https://oauth2.googleapis.com/token"
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                token_res = await client.post(token_url, data={
                    "client_id": cid,
                    "client_secret": sec,
                    "refresh_token": tok,
                    "grant_type": "refresh_token"
                })

                if token_res.status_code != 200:
                    try:
                        err_json = token_res.json()
                        err_desc = err_json.get("error_description") or err_json.get("error") or token_res.text
                    except Exception:
                        err_desc = token_res.text
                    return {
                        "connected": False,
                        "error": f"Google OAuth2 authorization rejected ({token_res.status_code}): {err_desc}"
                    }

                token_data = token_res.json()
                access_token = token_data.get("access_token")
                if not access_token:
                    return {
                        "connected": False,
                        "error": "Google OAuth2 succeeded but did not return an access token."
                    }

                # Query YouTube Data API for authenticated user channel
                ch_res = await client.get(
                    "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
                    headers={"Authorization": f"Bearer {access_token}"}
                )

                if ch_res.status_code == 200:
                    items = ch_res.json().get("items", [])
                    if items:
                        ch_item = items[0]
                        snippet = ch_item.get("snippet", {})
                        statistics = ch_item.get("statistics", {})
                        return {
                            "connected": True,
                            "channel_id": ch_item.get("id"),
                            "channel_title": snippet.get("title"),
                            "subscriber_count": int(statistics.get("subscriberCount", 0)),
                            "video_count": int(statistics.get("videoCount", 0)),
                            "view_count": int(statistics.get("viewCount", 0)),
                            "thumbnail": snippet.get("thumbnails", {}).get("default", {}).get("url")
                        }
                    else:
                        return {
                            "connected": True,
                            "channel_title": "Google Account Connected (No YouTube Channel created under this email)",
                            "subscriber_count": 0,
                            "video_count": 0,
                            "view_count": 0
                        }
                else:
                    return {
                        "connected": False,
                        "error": f"Failed to retrieve channel data from YouTube API: {ch_res.text}"
                    }
        except Exception as e:
            return {
                "connected": False,
                "error": f"Connection test failed: {str(e)}"
            }

    async def upload_short(
        self,
        video_path: str,
        title: str,
        description: str,
        tags: str,
        privacy_status: str = "public",
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        refresh_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Uploads an automated Short to YouTube via YouTube Data API v3 resumable protocol.
        """
        # 1. Resolve full video file path
        full_path = Path(video_path)
        if not full_path.is_absolute():
            full_path = settings.EXPORTS_DIR / video_path

        if not full_path.exists() or full_path.stat().st_size == 0:
            return {
                "success": False,
                "error": f"Video file not found or empty at: {full_path.name}",
                "mode": "file_not_found"
            }

        # 2. Check credentials
        cid = client_id or self.client_id
        sec = client_secret or self.client_secret
        tok = refresh_token or self.refresh_token

        if not (cid and sec and tok):
            return {
                "success": False,
                "error": "YouTube Data API is not configured. Please connect your YouTube account in Channel Settings.",
                "mode": "not_configured"
            }

        # 3. Refresh Google OAuth Access Token
        token_url = "https://oauth2.googleapis.com/token"
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                token_res = await client.post(token_url, data={
                    "client_id": cid,
                    "client_secret": sec,
                    "refresh_token": tok,
                    "grant_type": "refresh_token"
                })

                if token_res.status_code != 200:
                    try:
                        err_json = token_res.json()
                        err_desc = err_json.get("error_description") or err_json.get("error") or token_res.text
                    except Exception:
                        err_desc = token_res.text
                    print(f"[YouTubeService] OAuth refresh failed: {err_desc}")
                    return {
                        "success": False,
                        "error": f"YouTube Authentication Error ({err_desc}). Your Google OAuth refresh token has expired or is invalid. Please reconnect your YouTube channel in Channel Settings.",
                        "mode": "auth_error"
                    }

                token_data = token_res.json()
                access_token = token_data.get("access_token")
                if not access_token:
                    return {
                        "success": False,
                        "error": "Google OAuth succeeded but did not return a valid access token.",
                        "mode": "auth_error"
                    }

                # 4. Prepare YouTube Shorts metadata
                clean_tags = [t.strip().lstrip("#") for t in tags.split(",") if t.strip()]
                if "shorts" not in [t.lower() for t in clean_tags]:
                    clean_tags.append("shorts")
                if "minecraft" not in [t.lower() for t in clean_tags]:
                    clean_tags.append("minecraft")

                clean_title = title.strip()[:100]
                if "#shorts" not in clean_title.lower() and len(clean_title) <= 92:
                    clean_title += " #shorts"

                metadata = {
                    "snippet": {
                        "title": clean_title,
                        "description": description.strip(),
                        "tags": clean_tags,
                        "categoryId": "20"  # Gaming category
                    },
                    "status": {
                        "privacyStatus": privacy_status,
                        "selfDeclaredMadeForKids": False
                    }
                }

                file_size = full_path.stat().st_size

                # 5. Initiate Resumable Upload Session
                upload_url = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status"
                init_res = await client.post(
                    upload_url,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json; charset=UTF-8",
                        "X-Upload-Content-Type": "video/mp4",
                        "X-Upload-Content-Length": str(file_size)
                    },
                    json=metadata
                )

                upload_location = init_res.headers.get("Location")
                if not upload_location:
                    return {
                        "success": False,
                        "error": f"YouTube upload initiation failed (HTTP {init_res.status_code}): {init_res.text}",
                        "mode": "init_failed"
                    }

                # 6. Stream video bytes to YouTube
                with open(full_path, "rb") as f:
                    video_data = f.read()

                upload_res = await client.put(
                    upload_location,
                    headers={
                        "Content-Type": "video/mp4",
                        "Content-Length": str(file_size)
                    },
                    content=video_data,
                    timeout=300.0
                )

                if upload_res.status_code in (200, 201):
                    result = upload_res.json()
                    video_id = result.get("id")
                    return {
                        "success": True,
                        "video_id": video_id,
                        "url": f"https://youtube.com/shorts/{video_id}",
                        "mode": "real_api",
                        "message": f"Successfully published to YouTube Shorts! Video ID: {video_id}"
                    }
                else:
                    return {
                        "success": False,
                        "error": f"YouTube video data upload failed (HTTP {upload_res.status_code}): {upload_res.text}",
                        "mode": "upload_failed"
                    }

        except Exception as e:
            print(f"[YouTubeService] Upload exception: {e}")
            return {
                "success": False,
                "error": f"Network or processing error during YouTube upload: {str(e)}",
                "mode": "exception"
            }

    async def get_videos_statistics(
        self,
        video_ids: List[str],
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        refresh_token: Optional[str] = None
    ) -> Dict[str, Dict[str, int]]:
        """
        Fetches live viewCount, likeCount, commentCount from YouTube Data API
        for a batch of published video IDs.
        """
        cid = client_id or self.client_id
        sec = client_secret or self.client_secret
        tok = refresh_token or self.refresh_token

        if not (cid and sec and tok) or not video_ids:
            return {}

        real_ids = [vid for vid in video_ids if vid and not vid.startswith("mc_")]
        if not real_ids:
            return {}

        try:
            token_url = "https://oauth2.googleapis.com/token"
            async with httpx.AsyncClient(timeout=15.0) as client:
                token_res = await client.post(token_url, data={
                    "client_id": cid,
                    "client_secret": sec,
                    "refresh_token": tok,
                    "grant_type": "refresh_token"
                })
                if token_res.status_code != 200:
                    return {}
                access_token = token_res.json().get("access_token")

                ids_param = ",".join(real_ids[:50])
                stats_url = f"https://www.googleapis.com/youtube/v3/videos?part=statistics&id={ids_param}"
                res = await client.get(stats_url, headers={"Authorization": f"Bearer {access_token}"})
                if res.status_code == 200:
                    stats_map = {}
                    for item in res.json().get("items", []):
                        vid = item.get("id")
                        st = item.get("statistics", {})
                        stats_map[vid] = {
                            "views": int(st.get("viewCount", 0)),
                            "likes": int(st.get("likeCount", 0)),
                            "comments": int(st.get("commentCount", 0))
                        }
                    return stats_map
        except Exception as e:
            print(f"[YouTubeService] Error fetching video statistics: {e}")

        return {}

youtube_service = YouTubeService()

