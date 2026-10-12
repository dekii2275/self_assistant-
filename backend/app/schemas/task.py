from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Tiêu đề công việc")
    description: Optional[str] = Field(None, description="Chi tiết công việc")
    priority: str = Field("p3", description="Độ ưu tiên: p1, p2, p3, p4")
    status: str = Field("todo", description="Trạng thái: todo, in_progress, done")
    due_date: Optional[datetime] = Field(None, description="Hạn chót hoàn thành")
    estimated_minutes: Optional[int] = Field(None, ge=1, description="Thời gian ước tính (phút)")
    tags: Optional[str] = Field(None, description="Thẻ phân loại, phân cách bằng dấu phẩy")


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    is_completed: Optional[bool] = None
    due_date: Optional[datetime] = None
    estimated_minutes: Optional[int] = Field(None, ge=1)
    tags: Optional[str] = None


class TaskResponse(TaskBase):
    id: int
    is_completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
