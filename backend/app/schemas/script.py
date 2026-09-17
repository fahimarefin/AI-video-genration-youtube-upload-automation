from pydantic import BaseModel, Field
from typing import Optional, List
import datetime

class ScriptGenerateRequest(BaseModel):
    topic: Optional[str] = Field(None, description="Minecraft topic or custom prompt")
    niche_category: Optional[str] = Field("Minecraft Facts", description="Facts, Lore, Glitches, Redstone, Creepypasta")
    target_duration_sec: Optional[int] = Field(45, ge=15, le=60)
    voice_id: Optional[str] = Field("en-US-ChristopherNeural")
    previous_text: Optional[str] = Field(None, description="Previous script text to avoid repeating")
    tone: Optional[str] = Field("Viral Hype", description="Tone preset: Viral Hype, Dark Lore, Speedrun, Glitches, Mind-Blowing, Meme")
    custom_instruction: Optional[str] = Field(None, description="Optional custom instruction for AI")

class ScriptResponse(BaseModel):
    id: Optional[int] = None
    topic: str
    niche_category: str
    hook: str
    body: str
    cta: str
    full_text: str
    word_count: int
    estimated_duration_sec: int
    voice_id: str
    tone: Optional[str] = None
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class ScriptUpdateRequest(BaseModel):
    hook: Optional[str] = None
    body: Optional[str] = None
    cta: Optional[str] = None
    voice_id: Optional[str] = None

class ScriptRefineRequest(BaseModel):
    script_id: Optional[int] = None
    topic: str
    hook: str
    body: str
    cta: str
    action: str = Field("regenerate", description="regenerate, rewrite_hook, rewrite_body, rewrite_cta, change_tone, custom")
    tone: Optional[str] = "Viral Hype"
    instruction: Optional[str] = None
    voice_id: Optional[str] = "en-US-ChristopherNeural"
    niche_category: Optional[str] = "Minecraft Facts"

