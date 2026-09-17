from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import datetime
from app.core.database import get_db
from app.models.schedule import ScheduleSlot
from app.models.video import VideoJob, JobStatus
from app.schemas.schedule import ScheduleSlotResponse, ScheduleSlotCreate, AssignSlotRequest

router = APIRouter()

# 10 viral posting windows throughout the day to trigger the algorithm
DEFAULT_POSTING_SLOTS = [
    "08:00", "09:30", "11:00", "12:30", "14:00",
    "15:30", "17:00", "18:30", "20:00", "22:00"
]

@router.get("/slots", response_model=List[ScheduleSlotResponse])
async def list_schedule_slots(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ScheduleSlot).order_by(ScheduleSlot.slot_time.asc()))
    slots = result.scalars().all()
    
    # Auto-seed default 10 slots if database is empty
    if not slots:
        for t in DEFAULT_POSTING_SLOTS:
            slot = ScheduleSlot(slot_time=t, day_of_week="ALL", is_active=True)
            db.add(slot)
        await db.commit()
        result = await db.execute(select(ScheduleSlot).order_by(ScheduleSlot.slot_time.asc()))
        slots = result.scalars().all()

    return slots

@router.post("/slots", response_model=ScheduleSlotResponse)
async def create_schedule_slot(payload: ScheduleSlotCreate, db: AsyncSession = Depends(get_db)):
    slot = ScheduleSlot(
        slot_time=payload.slot_time,
        day_of_week=payload.day_of_week,
        is_active=payload.is_active
    )
    db.add(slot)
    await db.commit()
    await db.refresh(slot)
    return slot

@router.post("/slots/{slot_id}/assign")
async def assign_video_to_slot(slot_id: int, payload: AssignSlotRequest, db: AsyncSession = Depends(get_db)):
    slot = await db.get(ScheduleSlot, slot_id)
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    
    video = await db.get(VideoJob, payload.video_job_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video job not found")

    slot.video_job_id = video.id
    video.status = JobStatus.SCHEDULED.value
    await db.commit()

    return {"success": True, "message": f"Assigned video '{video.title}' to {slot.slot_time} slot"}

@router.post("/auto-schedule")
async def auto_schedule_ready_videos(db: AsyncSession = Depends(get_db)):
    """Automatically assigns unassigned READY videos to available time slots"""
    slots_res = await db.execute(select(ScheduleSlot).where(ScheduleSlot.video_job_id == None).order_by(ScheduleSlot.slot_time.asc()))
    empty_slots = slots_res.scalars().all()

    videos_res = await db.execute(select(VideoJob).where(VideoJob.status == JobStatus.READY.value).order_by(VideoJob.id.asc()))
    ready_videos = videos_res.scalars().all()

    assigned_count = 0
    for slot, video in zip(empty_slots, ready_videos):
        slot.video_job_id = video.id
        video.status = JobStatus.SCHEDULED.value
        assigned_count += 1

    await db.commit()
    return {
        "success": True,
        "assigned_count": assigned_count,
        "message": f"Auto-scheduled {assigned_count} videos into the 24/7 calendar queue"
    }
