import asyncio
import sys
import os
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Ensure stdout handles unicode
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.core.database import init_db, AsyncSessionLocal
from app.services.script_generator import script_generator
from app.services.seo_service import seo_service
from app.services.tts_service import tts_service
from app.services.video_composer import video_composer
from app.models.video import VideoJob, JobStatus
from app.models.channel import ChannelSettings
from sqlalchemy import select

async def run_tests():
    print("=== Testing Database Initialization ===")
    await init_db()
    print("✅ Database initialized successfully.")

    print("\n=== Testing Minecraft Script Generator ===")
    script = await script_generator.generate_script(
        topic="3 Minecraft Glitches That Still Work Today",
        niche_category="Minecraft Glitches"
    )
    assert script["hook"], "Hook should not be empty"
    assert script["body"], "Body should not be empty"
    assert script["cta"], "CTA should not be empty"
    assert script["word_count"] > 10, "Word count should be positive"
    print(f"✅ Generated Script: '{script['topic']}' ({script['word_count']} words, ~{script['estimated_duration_sec']}s)")
    print(f"   Hook: {script['hook']}")

    print("\n=== Testing SEO Service ===")
    seo = await seo_service.generate_seo(script["topic"], script["niche_category"])
    assert seo["title"], "Title should not be empty"
    assert len(seo["title_variants"]) >= 3, "Should have at least 3 title variants"
    assert "#shorts" in seo["description"], "Description should contain #shorts"
    print(f"✅ Generated SEO Title: {seo['title']}")
    print(f"   Tags: {seo['tags'][:60]}...")

    print("\n=== Testing Sample Media Ensure ===")
    await video_composer.ensure_sample_assets()
    print("✅ Sample media assets verified.")

    print("\n=== Testing Database VideoJob Lifecycle ===")
    async with AsyncSessionLocal() as session:
        job = VideoJob(
            title=script["topic"],
            topic=script["topic"],
            niche_category="Minecraft",
            status=JobStatus.DRAFT.value,
            progress=0,
            current_step="Test Created"
        )
        session.add(job)
        await session.commit()
        await session.refresh(job)
        assert job.id is not None, "Job should have an ID"
        print(f"✅ Created VideoJob #{job.id} with status {job.status}")

        # Update to READY
        job.status = JobStatus.READY.value
        job.progress = 100
        job.current_step = "Complete"
        await session.commit()
        
        # Verify fetch
        fetched = await session.get(VideoJob, job.id)
        assert fetched.status == JobStatus.READY.value
        print(f"✅ Updated VideoJob #{job.id} to {fetched.status}")

    print("\n🎉 ALL BACKEND PIPELINE UNIT TESTS PASSED!")

if __name__ == "__main__":
    asyncio.run(run_tests())
