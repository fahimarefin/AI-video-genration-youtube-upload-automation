import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from app.core.database import Base

class ScheduleSlot(Base):
    __tablename__ = "schedule_slots"

    id = Column(Integer, primary_key=True, index=True)
    slot_time = Column(String(10), nullable=False) # e.g. "09:00", "13:00", "17:00"
    day_of_week = Column(String(20), default="ALL") # ALL or MONDAY, TUESDAY...
    is_active = Column(Boolean, default=True)
    video_job_id = Column(Integer, ForeignKey("video_jobs.id"), nullable=True)
    last_run_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
