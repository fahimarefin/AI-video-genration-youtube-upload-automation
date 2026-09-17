from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.models.video import Script
from app.schemas.script import ScriptGenerateRequest, ScriptResponse, ScriptUpdateRequest, ScriptRefineRequest
from app.services.script_generator import script_generator

router = APIRouter()

@router.post("/generate", response_model=ScriptResponse)
async def generate_script(payload: ScriptGenerateRequest, db: AsyncSession = Depends(get_db)):
    """Generate a Minecraft Short script using AI / procedural viral engine"""
    script_data = await script_generator.generate_script(
        topic=payload.topic,
        niche_category=payload.niche_category,
        target_duration_sec=payload.target_duration_sec,
        voice_id=payload.voice_id or "en-US-ChristopherNeural",
        previous_text=payload.previous_text,
        tone=payload.tone,
        custom_instruction=payload.custom_instruction
    )
    
    script = Script(
        topic=script_data["topic"],
        niche_category=script_data["niche_category"],
        hook=script_data["hook"],
        body=script_data["body"],
        cta=script_data["cta"],
        full_text=script_data["full_text"],
        word_count=script_data["word_count"],
        estimated_duration_sec=script_data["estimated_duration_sec"],
        voice_id=script_data["voice_id"]
    )
    db.add(script)
    await db.commit()
    await db.refresh(script)
    return script

@router.post("/refine", response_model=ScriptResponse)
async def refine_script(payload: ScriptRefineRequest, db: AsyncSession = Depends(get_db)):
    """Refine or rewrite sections of a script using AI"""
    script_data = await script_generator.refine_script(
        topic=payload.topic,
        hook=payload.hook,
        body=payload.body,
        cta=payload.cta,
        action=payload.action,
        tone=payload.tone,
        instruction=payload.instruction,
        niche_category=payload.niche_category,
        voice_id=payload.voice_id or "en-US-ChristopherNeural"
    )

    if payload.script_id:
        script = await db.get(Script, payload.script_id)
        if script:
            script.topic = script_data["topic"]
            script.hook = script_data["hook"]
            script.body = script_data["body"]
            script.cta = script_data["cta"]
            script.full_text = script_data["full_text"]
            script.word_count = script_data["word_count"]
            script.estimated_duration_sec = script_data["estimated_duration_sec"]
            if payload.voice_id:
                script.voice_id = payload.voice_id
            await db.commit()
            await db.refresh(script)
            return script

    script = Script(
        topic=script_data["topic"],
        niche_category=script_data["niche_category"],
        hook=script_data["hook"],
        body=script_data["body"],
        cta=script_data["cta"],
        full_text=script_data["full_text"],
        word_count=script_data["word_count"],
        estimated_duration_sec=script_data["estimated_duration_sec"],
        voice_id=script_data["voice_id"]
    )
    db.add(script)
    await db.commit()
    await db.refresh(script)
    return script

@router.get("", response_model=List[ScriptResponse])
async def list_scripts(limit: int = 20, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Script).order_by(Script.id.desc()).limit(limit))
    return result.scalars().all()

@router.get("/presets")
async def get_presets():
    return script_generator.get_preset_topics()

@router.get("/{script_id}", response_model=ScriptResponse)
async def get_script(script_id: int, db: AsyncSession = Depends(get_db)):
    script = await db.get(Script, script_id)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    return script

@router.put("/{script_id}", response_model=ScriptResponse)
async def update_script(script_id: int, payload: ScriptUpdateRequest, db: AsyncSession = Depends(get_db)):
    script = await db.get(Script, script_id)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    
    if payload.hook is not None:
        script.hook = payload.hook
    if payload.body is not None:
        script.body = payload.body
    if payload.cta is not None:
        script.cta = payload.cta
    if payload.voice_id is not None:
        script.voice_id = payload.voice_id

    script.full_text = f"{script.hook} {script.body} {script.cta}"
    script.word_count = len(script.full_text.split())
    script.estimated_duration_sec = max(15, min(60, int(script.word_count / 2.5)))
    
    await db.commit()
    await db.refresh(script)
    return script
