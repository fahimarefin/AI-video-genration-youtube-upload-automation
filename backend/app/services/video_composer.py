import asyncio
import os
import shutil
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional
from app.core.config import settings

class VideoComposerService:
    def __init__(self):
        self.exports_dir = settings.EXPORTS_DIR
        self.gameplay_dir = settings.GAMEPLAY_DIR
        self.music_dir = settings.MUSIC_DIR
        self.ffmpeg_cmd = shutil.which("ffmpeg")

    def has_ffmpeg(self) -> bool:
        return self.ffmpeg_cmd is not None

    async def ensure_sample_assets(self):
        """Ensures valid, playable 1080x1920 gameplay videos and high quality audio exist"""
        self.gameplay_dir.mkdir(parents=True, exist_ok=True)
        self.music_dir.mkdir(parents=True, exist_ok=True)
        self.exports_dir.mkdir(parents=True, exist_ok=True)

        if not self.has_ffmpeg():
            return

        # 1. Ensure gameplay presets
        gameplay_presets = [
            "minecraft_parkour.mp4",
            "minecraft_building.mp4",
            "minecraft_nether.mp4",
            "minecraft_mining.mp4"
        ]

        # Find any existing valid gameplay file (> 1MB) to clone if needed
        valid_clip = None
        for name in gameplay_presets:
            p = self.gameplay_dir / name
            if p.exists() and p.stat().st_size > 1_000_000:
                valid_clip = p
                break

        for name in gameplay_presets:
            p = self.gameplay_dir / name
            if not p.exists() or p.stat().st_size < 100_000:
                if valid_clip and valid_clip.exists():
                    shutil.copyfile(valid_clip, p)
                else:
                    # Generate dynamic procedural voxel video with FFmpeg
                    try:
                        cmd = [
                            self.ffmpeg_cmd, "-y",
                            "-f", "lavfi",
                            "-i", "life=s=540x960:mold=10:rate=30:ratio=0.5:death_color=#0f172a:life_color=#10b981",
                            "-vf", "scale=1080:1920:flags=neighbor",
                            "-t", "30",
                            "-c:v", "libx264",
                            "-preset", "veryfast",
                            "-pix_fmt", "yuv420p",
                            str(p)
                        ]
                        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=40)
                        if p.exists() and p.stat().st_size > 100_000:
                            valid_clip = p
                    except Exception as e:
                        print(f"[VideoComposer] Warning generating {name}: {e}")

        # 2. Ensure music presets
        music_presets = [
            (
                "minecraft_ambient.mp3",
                "aevalsrc=exprs='sin(2*PI*261.63*t)*0.08*exp(-0.3*(mod(t\\,4)))+sin(2*PI*329.63*t)*0.06*exp(-0.3*(mod(t+1\\,4)))+sin(2*PI*392.00*t)*0.06*exp(-0.3*(mod(t+2\\,4)))+sin(2*PI*523.25*t)*0.04*exp(-0.3*(mod(t+3\\,4)))':sample_rate=44100",
                "lowpass=f=1200,volume=0.9"
            ),
            (
                "minecraft_lofi.mp3",
                "aevalsrc=exprs='sin(2*PI*220*t)*0.09*exp(-0.25*(mod(t\\,3)))+sin(2*PI*261.63*t)*0.07*exp(-0.25*(mod(t+1\\,3)))+sin(2*PI*329.63*t)*0.07*exp(-0.25*(mod(t+2\\,3)))+sin(2*PI*130.81*t)*0.1':sample_rate=44100",
                "lowpass=f=950,volume=0.9"
            ),
            (
                "minecraft_hype.mp3",
                "aevalsrc=exprs='sin(2*PI*110*t)*0.12*exp(-0.8*(mod(t\\,0.5)))+sin(2*PI*440*t)*0.05*exp(-0.5*(mod(t\\,0.25)))+sin(2*PI*587.33*t)*0.06*exp(-0.4*(mod(t\\,1)))':sample_rate=44100",
                "highpass=f=80,volume=0.95"
            )
        ]

        for m_name, expr, flt in music_presets:
            mp = self.music_dir / m_name
            if not mp.exists() or mp.stat().st_size < 50_000:
                try:
                    cmd = [
                        self.ffmpeg_cmd, "-y",
                        "-f", "lavfi",
                        "-i", expr,
                        "-af", flt,
                        "-t", "60",
                        "-c:a", "libmp3lame",
                        "-b:a", "192k",
                        str(mp)
                    ]
                    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=20)
                except Exception as e:
                    print(f"[VideoComposer] Warning synthesizing music {m_name}: {e}")

    async def compose_short(
        self,
        audio_path: str,
        subtitles_path: Optional[str] = None,
        gameplay_clip_name: Optional[str] = "minecraft_parkour.mp4",
        bg_music_name: Optional[str] = "minecraft_ambient.mp3",
        duration_sec: float = 30.0,
        job_id: int = 0
    ) -> Dict[str, Any]:
        """
        Stitches vertical 9:16 gameplay video, voiceover, background music, and dynamic subtitles.
        """
        await self.ensure_sample_assets()
        
        output_filename = f"short_{job_id}_{os.urandom(4).hex()}.mp4"
        output_path = self.exports_dir / output_filename
        
        # Locate background clip (must exist and be valid)
        bg_clip_path = self.gameplay_dir / (gameplay_clip_name or "minecraft_parkour.mp4")
        if not bg_clip_path.exists() or bg_clip_path.stat().st_size < 50_000:
            # Fall back to any valid gameplay file
            valid_clips = [p for p in self.gameplay_dir.glob("*.mp4") if p.stat().st_size > 50_000]
            if valid_clips:
                bg_clip_path = valid_clips[0]

        # Locate music
        music_path = self.music_dir / (bg_music_name or "minecraft_ambient.mp3")
        if not music_path.exists() or music_path.stat().st_size < 10_000:
            valid_music = [p for p in self.music_dir.glob("*.mp3") if p.stat().st_size > 10_000]
            if valid_music:
                music_path = valid_music[0]

        if not self.has_ffmpeg():
            raise RuntimeError("FFmpeg executable not found in system PATH. Cannot render video.")

        # Build FFmpeg command
        filter_complex = [
            "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[vbg]"
        ]
        
        v_out = "[vbg]"
        if subtitles_path and Path(subtitles_path).exists() and Path(subtitles_path).stat().st_size > 50:
            # Escape path for FFmpeg filter on Windows/Linux
            escaped_sub = str(subtitles_path).replace("\\", "/").replace(":", "\\:")
            filter_complex.append(f"{v_out}ass='{escaped_sub}'[vfinal]")
            v_out = "[vfinal]"

        inputs = [
            "-stream_loop", "-1", "-i", str(bg_clip_path),
            "-i", str(audio_path)
        ]
        
        if music_path.exists() and music_path.stat().st_size > 1000:
            inputs.extend(["-stream_loop", "-1", "-i", str(music_path)])
            filter_complex.append(
                "[1:a]volume=1.0[a_voice];[2:a]volume=0.14[a_music];[a_voice][a_music]amix=inputs=2:duration=first[afinal]"
            )
            a_out = "[afinal]"
        else:
            a_out = "1:a"

        full_filter = ";".join(filter_complex)

        cmd = [
            self.ffmpeg_cmd, "-y",
            *inputs,
            "-filter_complex", full_filter,
            "-map", v_out,
            "-map", a_out,
            "-t", str(duration_sec),
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "22",
            "-c:a", "aac",
            "-b:a", "192k",
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            str(output_path)
        ]

        # Run FFmpeg process asynchronously
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await proc.communicate()
        
        if proc.returncode != 0 or not output_path.exists() or output_path.stat().st_size < 10_000:
            err_msg = stderr.decode(errors="replace") if stderr else "Unknown error"
            print(f"[VideoComposer] FFmpeg failed (code {proc.returncode}): {err_msg}")
            raise RuntimeError(f"FFmpeg composition failed: {err_msg[:400]}")

        return {
            "success": True,
            "output_filename": output_filename,
            "output_path": str(output_path),
            "duration_sec": duration_sec,
            "aspect_ratio": "9:16",
            "resolution": "1080x1920"
        }

video_composer = VideoComposerService()
