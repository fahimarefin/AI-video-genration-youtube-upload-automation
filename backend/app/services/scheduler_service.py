import asyncio
import datetime
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.video import VideoJob, Script, JobStatus
from app.models.schedule import ScheduleSlot
from app.services.script_generator import script_generator
from app.services.tts_service import tts_service
from app.services.subtitle_service import subtitle_service
from app.services.video_composer import video_composer
from app.services.seo_service import seo_service
from app.core.database import AsyncSessionLocal

class PipelineService:
    def __init__(self):
        # Concurrency limiter: encode up to 2 videos concurrently to prevent I/O and CPU choking
        self._semaphore = asyncio.Semaphore(2)

    async def _update_job(self, job_id: int, **fields):
        """Perform an isolated, atomic update that commits and closes immediately."""
        async with AsyncSessionLocal() as session:
            try:
                await session.execute(
                    update(VideoJob).where(VideoJob.id == job_id).values(**fields)
                )
                await session.commit()
            except Exception as e:
                await session.rollback()
                print(f"[PipelineService] DB update error for job {job_id}: {e}")
                raise

    async def run_pipeline_for_job(self, job_id: int):
        """
        Executes the full automated pipeline for a VideoJob from start to finish:
        1. Script -> 2. Voiceover -> 3. Subtitles -> 4. Video Assembly -> 5. SEO
        Uses short-lived atomic DB transactions so SQLite is never locked during external calls.
        """
        async with self._semaphore:
            # 1. Fetch initial job parameters in a quick read session
            async with AsyncSessionLocal() as session:
                result = await session.execute(select(VideoJob).where(VideoJob.id == job_id))
                job = result.scalar_one_or_none()
                if not job:
                    return
                topic = job.topic
                niche_category = job.niche_category or "Minecraft Facts"
                voice_id = job.voice_id or "en-US-ChristopherNeural"
                gameplay_clip = job.gameplay_clip or "minecraft_parkour.mp4"
                bg_music = job.bg_music or "minecraft_ambient.mp3"
                subtitle_style = job.subtitle_style or "yellow_glow"
                script_id = job.script_id

            try:
                # Step 1: Script Resolution
                script_full_text = ""
                if script_id:
                    async with AsyncSessionLocal() as session:
                        existing_script = await session.get(Script, script_id)
                        if existing_script:
                            script_full_text = existing_script.full_text
                            if existing_script.niche_category:
                                niche_category = existing_script.niche_category

                if not script_full_text:
                    await self._update_job(
                        job_id,
                        status=JobStatus.SCRIPTING.value,
                        progress=15,
                        current_step="Generating Minecraft Script...",
                        niche_category=niche_category
                    )

                    script_data = await script_generator.generate_script(
                        topic=topic,
                        niche_category=niche_category,
                        voice_id=voice_id
                    )

                    async with AsyncSessionLocal() as session:
                        new_script = Script(
                            topic=script_data["topic"],
                            niche_category=script_data["niche_category"],
                            hook=script_data["hook"],
                            body=script_data["body"],
                            cta=script_data["cta"],
                            full_text=script_data["full_text"],
                            word_count=script_data["word_count"],
                            estimated_duration_sec=script_data["estimated_duration_sec"],
                            voice_id=voice_id
                        )
                        session.add(new_script)
                        await session.commit()
                        await session.refresh(new_script)
                        script_id = new_script.id
                        script_full_text = script_data["full_text"]

                    await self._update_job(job_id, script_id=script_id)

                # Step 2: Voiceover Synthesis (TTS)
                await self._update_job(
                    job_id,
                    status=JobStatus.VOICEOVER.value,
                    progress=30,
                    current_step="Synthesizing AI Voiceover & Word Boundaries..."
                )

                tts_result = await tts_service.generate_voiceover(
                    text=script_full_text,
                    voice_id=voice_id,
                    job_id=job_id
                )

                duration_sec = tts_result["duration_sec"]
                audio_filename = tts_result["audio_filename"]
                await self._update_job(
                    job_id,
                    audio_path=audio_filename,
                    duration_sec=duration_sec,
                    progress=50,
                    current_step="Styling Dynamic Subtitles..."
                )

                # Step 3: Subtitles Synthesis
                subs_path = subtitle_service.generate_ass_subtitles(
                    word_timings=tts_result["word_timings"],
                    style_preset=subtitle_style,
                    job_id=job_id
                )

                await self._update_job(
                    job_id,
                    subtitles_path=subs_path,
                    status=JobStatus.COMPOSING.value,
                    progress=65,
                    current_step="Composing 9:16 Vertical Video (FFmpeg)..."
                )

                # Step 4: Video Composition (Gameplay + Voiceover + Music + Dynamic Subs)
                comp_result = await video_composer.compose_short(
                    audio_path=tts_result["audio_path"],
                    subtitles_path=subs_path,
                    gameplay_clip_name=gameplay_clip,
                    bg_music_name=bg_music,
                    duration_sec=duration_sec,
                    job_id=job_id
                )

                await self._update_job(
                    job_id,
                    video_path=comp_result["output_filename"],
                    progress=85,
                    current_step="Generating Viral SEO Metadata..."
                )

                # Step 5: SEO Generation
                seo_data = await seo_service.generate_seo(topic=topic, niche_category=niche_category)

                # Mark Ready
                await self._update_job(
                    job_id,
                    seo_title=seo_data["title"],
                    seo_description=seo_data["description"],
                    seo_tags=seo_data["tags"],
                    status=JobStatus.READY.value,
                    progress=100,
                    current_step="Complete & Ready for Publishing",
                    error_message=None
                )

            except Exception as e:
                print(f"[PipelineService] Error processing job {job_id}: {e}")
                try:
                    await self._update_job(
                        job_id,
                        status=JobStatus.FAILED.value,
                        error_message=str(e),
                        current_step=f"Failed: {str(e)[:100]}"
                    )
                except Exception as commit_err:
                    print(f"[PipelineService] Could not record failure for job {job_id}: {commit_err}")

    async def trigger_batch_generation(self, count: int = 10, voice_id: str = "en-US-ChristopherNeural") -> List[int]:
        """
        Creates and starts a batch of up to 10 automated shorts using preset Minecraft topics.
        """
        presets = script_generator.get_preset_topics()
        job_ids = []

        async with AsyncSessionLocal() as session:
            for i in range(count):
                preset = presets[i % len(presets)]
                job = VideoJob(
                    title=preset["topic"],
                    topic=preset["topic"],
                    niche_category=preset.get("category", "Minecraft Facts"),
                    status=JobStatus.DRAFT.value,
                    progress=0,
                    current_step="Queued",
                    voice_id=voice_id,
                    gameplay_clip="minecraft_parkour.mp4",
                    bg_music="minecraft_ambient.mp3",
                    subtitle_style="yellow_glow"
                )
                session.add(job)
                await session.flush()
                job_ids.append(job.id)
            await session.commit()

        # Launch pipeline execution in background
        for j_id in job_ids:
            asyncio.create_task(self.run_pipeline_for_job(j_id))

        return job_ids

pipeline_service = PipelineService()
