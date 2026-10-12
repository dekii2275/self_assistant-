from datetime import datetime
from pydantic import BaseModel, Field


class GoalCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Tiêu đề mục tiêu")


class GoalUpdate(BaseModel):
    title: str | None = None
    is_completed: bool | None = None


class GoalResponse(BaseModel):
    id: int
    title: str
    is_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True
