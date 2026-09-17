from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import os
from pathlib import Path
import shutil
from app.core.config import settings
from app.core.database import get_db
from app.models.channel import MediaAsset
from app.schemas.channel import MediaAssetResponse

from app.services.video_composer import video_composer

router = APIRouter()

PRESET_GAMEPLAY = [
    {"filename": "minecraft_parkour.mp4", "title": "Spiral Parkour Speedrun", "asset_type": "gameplay", "duration": 60},
    {"filename": "minecraft_nether.mp4", "title": "Nether Fortress Exploration", "asset_type": "gameplay", "duration": 45},
    {"filename": "minecraft_mining.mp4", "title": "Deepslate Diamond Mining", "asset_type": "gameplay", "duration": 60},
    {"filename": "minecraft_building.mp4", "title": "Mega Castle Timelapse", "asset_type": "gameplay", "duration": 50}
]

PRESET_MUSIC = [
    {"filename": "minecraft_ambient.mp3", "title": "C418 Nostalgia Ambient", "asset_type": "music", "duration": 90},
    {"filename": "minecraft_lofi.mp3", "title": "Chill Minecraft Lo-Fi Beats", "asset_type": "music", "duration": 120},
    {"filename": "minecraft_hype.mp3", "title": "Speedrun Dramatic Synth", "asset_type": "music", "duration": 60}
]

@router.get("", response_model=List[MediaAssetResponse])
async def list_media_assets(asset_type: str = "gameplay", db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MediaAsset).where(MediaAsset.asset_type == asset_type))
    assets = result.scalars().all()

    # Seed presets if table is empty
    if not assets:
        await video_composer.ensure_sample_assets()
        source_presets = PRESET_GAMEPLAY if asset_type == "gameplay" else PRESET_MUSIC
        for p in source_presets:
            folder = settings.GAMEPLAY_DIR if p["asset_type"] == "gameplay" else settings.MUSIC_DIR
            fpath = folder / p["filename"]
            
            asset = MediaAsset(
                filename=p["filename"],
                title=p["title"],
                asset_type=p["asset_type"],
                file_path=str(fpath),
                duration_sec=p["duration"],
                is_default=True
            )
            db.add(asset)
        await db.commit()
        result = await db.execute(select(MediaAsset).where(MediaAsset.asset_type == asset_type))
        assets = result.scalars().all()

    return assets

@router.post("/upload")
async def upload_asset(
    title: str = Form(...),
    asset_type: str = Form(...), # "gameplay" or "music"
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    target_dir = settings.GAMEPLAY_DIR if asset_type == "gameplay" else settings.MUSIC_DIR
    clean_filename = f"{Path(file.filename).stem}_{os.urandom(3).hex()}{Path(file.filename).suffix}"
    dest_path = target_dir / clean_filename

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    asset = MediaAsset(
        filename=clean_filename,
        title=title,
        asset_type=asset_type,
        file_path=str(dest_path),
        duration_sec=60,
        is_default=False
    )
    db.add(asset)
    await db.commit()
    await db.refresh(asset)

    return {"success": True, "asset": asset}
