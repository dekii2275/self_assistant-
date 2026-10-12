from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SubtaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Nội dung bước con")


class SubtaskCreate(SubtaskBase):
    pass


class SubtaskResponse(SubtaskBase):
    id: int
    task_id: int
    is_completed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Tiêu đề công việc")
    description: Optional[str] = Field(None, description="Chi tiết công việc")
    priority: str = Field("p3", description="Độ ưu tiên: p1, p2, p3, p4")
    status: str = Field("todo", description="Trạng thái: todo, in_progress, done")
    due_date: Optional[datetime] = Field(None, description="Hạn chót hoàn thành")
    estimated_minutes: Optional[int] = Field(None, ge=1, description="Thời gian ước tính (phút)")
    actual_minutes: int = Field(0, ge=0, description="Thời gian thực tế đã làm (phút)")
    recurrence_rule: Optional[str] = Field(None, description="Quy tắc lặp: daily, weekdays, weekly, monthly")
    tags: Optional[str] = Field(None, description="Thẻ phân loại, phân cách bằng dấu phẩy")


class TaskCreate(TaskBase):
    subtask_titles: Optional[List[str]] = Field(None, description="Danh sách các bước con ban đầu")


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    is_completed: Optional[bool] = None
    due_date: Optional[datetime] = None
    estimated_minutes: Optional[int] = Field(None, ge=1)
    actual_minutes: Optional[int] = Field(None, ge=0)
    recurrence_rule: Optional[str] = None
    tags: Optional[str] = None


class TaskResponse(TaskBase):
    id: int
    is_completed: bool
    created_at: datetime
    updated_at: datetime
    subtasks: List[SubtaskResponse] = []

    model_config = ConfigDict(from_attributes=True)


class PomodoroLogRequest(BaseModel):
    minutes: int = Field(25, ge=1, le=180, description="Số phút phiên Pomodoro hoàn thành")
