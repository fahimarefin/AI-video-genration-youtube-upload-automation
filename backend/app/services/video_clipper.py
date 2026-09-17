import os
import uuid
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional
from app.core.config import settings
from app.services.subtitle_service import subtitle_service
from app.services.seo_service import seo_service

class VideoClipperService:
    """
    Automated clipping engine: extracts moments from long-form video,
    reframes 16:9 to vertical 9:16, burns in captions, and prepares ready-to-publish Shorts.
    """

    def slice_and_reframe(
        self,
        source_video_path: str,
        start_sec: float,
        end_sec: float,
        output_filename: Optional[str] = None,
        reframe_mode: str = "center_crop", # "center_crop" or "blur_background"
        hook_text: Optional[str] = None,
        subtitle_style: str = "yellow_glow"
    ) -> Dict[str, Any]:
        """
        Extracts a segment from source video, reformats to 9:16 (1080x1920 60fps),
        and burns in animated retention captions.
        """
        source_path = Path(source_video_path)
        if not source_path.is_absolute():
            source_path = settings.STORAGE_DIR / source_video_path

        if not source_path.exists():
            raise FileNotFoundError(f"Source video not found: {source_path}")

        duration = max(5.0, round(end_sec - start_sec, 2))
        if not output_filename:
            unique_id = uuid.uuid4().hex[:8]
            output_filename = f"clip_{unique_id}.mp4"

        output_path = settings.EXPORTS_DIR / output_filename
        settings.EXPORTS_DIR.mkdir(parents=True, exist_ok=True)

        # 1. Generate Subtitle track if hook text provided
        sub_ass_path = None
        if hook_text:
            sub_filename = f"clip_subs_{uuid.uuid4().hex[:8]}.ass"
            sub_ass_path = settings.SUBTITLES_DIR / sub_filename
            sub_text = hook_text.strip()
            subtitle_service.generate_ass_subtitles(
                full_text=sub_text,
                duration_sec=duration,
                style_name=subtitle_style,
                output_path=sub_ass_path
            )

        # 2. Build FFmpeg Filtergraph for 9:16 re-framing
        if reframe_mode == "blur_background":
            # Dual-layer: blurred zoomed background + centered sharp foreground
            vf = (
                "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,"
                "boxblur=25:5[bg];"
                "[0:v]scale=1080:-2:force_original_aspect_ratio=decrease[fg];"
                "[bg][fg]overlay=(W-w)/2:(H-h)/2,fps=60"
            )
        else:
            # High-impact dynamic center crop to 1080x1920
            vf = "crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=1080:1920:flags=lanczos,fps=60"

        # Overlay ASS subtitles if generated
        if sub_ass_path and sub_ass_path.exists():
            escaped_sub = str(sub_ass_path).replace("\\", "/").replace(":", "\\:")
            vf += f",subtitles='{escaped_sub}'"

        # 3. Execute FFmpeg trimming & re-framing
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(start_sec),
            "-t", str(duration),
            "-i", str(source_path),
            "-filter_complex", vf,
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "20",
            "-c:a", "aac",
            "-b:a", "192k",
            "-ar", "44100",
            "-movflags", "+faststart",
            str(output_path)
        ]

        print(f"[VideoClipper] Clipping {source_path.name} ({start_sec}s -> {end_sec}s) to {output_filename}...")
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=180)

        if res.returncode != 0:
            print(f"[VideoClipper] FFmpeg filter complex failed ({res.stderr[:200]}), trying simple crop...")
            # Fallback simple scale & crop
            fallback_cmd = [
                "ffmpeg", "-y",
                "-ss", str(start_sec),
                "-t", str(duration),
                "-i", str(source_path),
                "-vf", "crop=ih*9/16:ih,scale=1080:1920",
                "-c:v", "libx264",
                "-preset", "veryfast",
                "-c:a", "aac",
                "-movflags", "+faststart",
                str(output_path)
            ]
            fallback_res = subprocess.run(fallback_cmd, capture_output=True, text=True, timeout=120)
            if fallback_res.returncode != 0:
                raise RuntimeError(f"FFmpeg clipping failed: {fallback_res.stderr[-300:]}")

        # 4. Generate preview thumbnail
        thumb_filename = f"thumb_{output_path.stem}.jpg"
        thumb_path = settings.STORAGE_DIR / "uploads" / thumb_filename
        thumb_path.parent.mkdir(parents=True, exist_ok=True)
        try:
            subprocess.run([
                "ffmpeg", "-y",
                "-ss", "00:00:01",
                "-i", str(output_path),
                "-vframes", "1",
                "-q:v", "2",
                str(thumb_path)
            ], capture_output=True, timeout=15)
        except Exception:
            pass

        return {
            "output_filename": output_filename,
            "output_path": str(output_path),
            "duration_sec": duration,
            "file_size_mb": round(output_path.stat().st_size / (1024 * 1024), 2),
            "thumbnail_path": thumb_filename if thumb_path.exists() else None,
            "reframe_mode": reframe_mode
        }

video_clipper = VideoClipperService()
