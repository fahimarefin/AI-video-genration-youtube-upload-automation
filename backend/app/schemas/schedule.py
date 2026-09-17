from pydantic import BaseModel
from typing import Optional, List
import datetime

class ScheduleSlotResponse(BaseModel):
    id: int
    slot_time: str
    day_of_week: str
    is_active: bool
    video_job_id: Optional[int] = None
    last_run_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class ScheduleSlotCreate(BaseModel):
    slot_time: str # "10:00"
    day_of_week: str = "ALL"
    is_active: bool = True

class AssignSlotRequest(BaseModel):
    video_job_id: int
