import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.core.config import settings

class SubtitleService:
    def __init__(self):
        self.output_dir = settings.SUBTITLES_DIR

    def format_ass_time(self, seconds: float) -> str:
        """Converts float seconds into ASS timestamp format: H:MM:SS.cs"""
        hrs = int(seconds // 3600)
        mins = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        csecs = int(round((seconds - int(seconds)) * 100))
        return f"{hrs}:{mins:02d}:{secs:02d}.{csecs:02d}"

    def generate_ass_subtitles(
        self,
        word_timings: Optional[List[Dict[str, Any]]] = None,
        style_preset: str = "yellow_glow",
        job_id: int = 0,
        full_text: Optional[str] = None,
        duration_sec: float = 30.0,
        style_name: Optional[str] = None,
        output_path: Optional[Path] = None
    ) -> str:
        """
        Creates an ASS subtitle script optimized for vertical 1080x1920 YouTube Shorts.
        Renders chunks of 2-3 words in bold, centered, with thick outline.
        Supports both precise word-timing arrays and raw text hook pacing.
        """
        if output_path:
            filepath = Path(output_path)
            filepath.parent.mkdir(parents=True, exist_ok=True)
        else:
            filename = f"subs_{job_id}_{os.urandom(4).hex()}.ass"
            filepath = self.output_dir / filename
            self.output_dir.mkdir(parents=True, exist_ok=True)

        effective_style = style_name or style_preset or "yellow_glow"

        # Style colors (AABBGGRR format in ASS)
        if effective_style == "yellow_glow":
            primary_color = "&H0000FFFF"  # Neon Yellow
        elif effective_style == "clean_white":
            primary_color = "&H00FFFFFF"  # Pure White
        else:
            primary_color = "&H0050FA7B"  # Neon Emerald
        outline_color = "&H00000000"  # Solid black outline

        ass_header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: ShortsStyle,Impact,80,{primary_color},&H000000FF,{outline_color},&H80000000,-1,0,0,0,100,100,2,0,1,10,4,2,60,60,780,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
        events = []

        # If word timings provided from TTS
        if word_timings:
            chunk_size = 3
            for i in range(0, len(word_timings), chunk_size):
                chunk = word_timings[i:i + chunk_size]
                if not chunk:
                    continue
                start_sec = chunk[0]["offset"]
                end_sec = chunk[-1]["offset"] + chunk[-1]["duration"]
                text_str = " ".join([w["word"].upper() for w in chunk])
                start_str = self.format_ass_time(start_sec)
                end_str = self.format_ass_time(end_sec)
                events.append(f"Dialogue: 0,{start_str},{end_str},ShortsStyle,,0,0,0,,{text_str}")

        # If full_text provided for clipped hook
        elif full_text:
            words = full_text.strip().split()
            if words:
                chunk_size = 3
                chunks = [words[i:i + chunk_size] for i in range(0, len(words), chunk_size)]
                time_per_chunk = min(2.5, duration_sec / max(1, len(chunks)))
                for idx, chunk in enumerate(chunks):
                    start_sec = idx * time_per_chunk
                    end_sec = min(duration_sec, (idx + 1) * time_per_chunk)
                    text_str = " ".join([w.upper() for w in chunk])
                    start_str = self.format_ass_time(start_sec)
                    end_str = self.format_ass_time(end_sec)
                    events.append(f"Dialogue: 0,{start_str},{end_str},ShortsStyle,,0,0,0,,{text_str}")

        ass_content = ass_header + "\n".join(events)

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(ass_content)

        return str(filepath)

subtitle_service = SubtitleService()
