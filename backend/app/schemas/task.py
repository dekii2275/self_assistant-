from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


PriorityValue = Literal["p1", "p2", "p3", "p4"]
StatusValue = Literal["todo", "in_progress", "done"]
RecurrenceValue = Literal["daily", "weekdays", "weekly", "monthly"]
ReminderValue = Literal[10, 60, 1440]


class SubtaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Nội dung bước con")

    @field_validator("title")
    @classmethod
    def strip_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Title must not be blank")
        return value


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
    priority: PriorityValue = Field("p3", description="Độ ưu tiên: p1, p2, p3, p4")
    status: StatusValue = Field("todo", description="Trạng thái: todo, in_progress, done")
    due_date: Optional[datetime] = Field(None, description="Hạn chót hoàn thành")
    reminder_minutes_before: Optional[ReminderValue] = Field(None, description="Nhắc trước hạn 10 phút, 1 giờ hoặc 1 ngày")
    email_reminder_to: Optional[EmailStr] = Field(None, description="Địa chỉ nhận email nhắc việc")
    estimated_minutes: Optional[int] = Field(None, ge=1, description="Thời gian ước tính (phút)")
    actual_minutes: int = Field(0, ge=0, description="Thời gian thực tế đã làm (phút)")
    recurrence_rule: Optional[RecurrenceValue] = Field(None, description="Quy tắc lặp: daily, weekdays, weekly, monthly")
    tags: Optional[str] = Field(None, description="Thẻ phân loại, phân cách bằng dấu phẩy")

    @field_validator("title")
    @classmethod
    def strip_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Title must not be blank")
        return value

    @model_validator(mode="after")
    def reminder_needs_due_date(self):
        if self.reminder_minutes_before is not None and self.due_date is None:
            raise ValueError("A due date is required for a reminder")
        if self.email_reminder_to is not None and self.reminder_minutes_before is None:
            raise ValueError("A reminder is required for email delivery")
        return self


class TaskCreate(TaskBase):
    subtask_titles: Optional[List[str]] = Field(None, description="Danh sách các bước con ban đầu")


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    priority: Optional[PriorityValue] = None
    status: Optional[StatusValue] = None
    is_completed: Optional[bool] = None
    due_date: Optional[datetime] = None
    reminder_minutes_before: Optional[ReminderValue] = None
    email_reminder_to: Optional[EmailStr] = None
    estimated_minutes: Optional[int] = Field(None, ge=1)
    actual_minutes: Optional[int] = Field(None, ge=0)
    recurrence_rule: Optional[RecurrenceValue] = None
    tags: Optional[str] = None

    @field_validator("title", "priority", "status", "is_completed", "actual_minutes")
    @classmethod
    def reject_null_required_fields(cls, value):
        if value is None:
            raise ValueError("Field cannot be null")
        if isinstance(value, str) and not value.strip():
            raise ValueError("Field cannot be blank")
        return value.strip() if isinstance(value, str) else value

    @model_validator(mode="after")
    def consistent_completion(self):
        if "status" in self.model_fields_set and "is_completed" in self.model_fields_set:
            if self.is_completed != (self.status == "done"):
                raise ValueError("status and is_completed disagree")
        if self.reminder_minutes_before is not None and "due_date" in self.model_fields_set and self.due_date is None:
            raise ValueError("A due date is required for a reminder")
        if self.email_reminder_to is not None and "reminder_minutes_before" in self.model_fields_set and self.reminder_minutes_before is None:
            raise ValueError("A reminder is required for email delivery")
        return self


class TaskResponse(TaskBase):
    id: int
    is_completed: bool
    created_at: datetime
    updated_at: datetime
    subtasks: List[SubtaskResponse] = []

    model_config = ConfigDict(from_attributes=True)


class PomodoroLogRequest(BaseModel):
    minutes: int = Field(25, ge=1, le=180, description="Số phút phiên Pomodoro hoàn thành")
