from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.crud import task as crud_task
from app.schemas.task import (
    TaskCreate,
    TaskResponse,
    TaskUpdate,
    SubtaskCreate,
    SubtaskResponse,
    PomodoroLogRequest,
)

router = APIRouter()


@router.get("", response_model=List[TaskResponse], summary="Lấy danh sách công việc")
async def read_tasks(
    status: Optional[str] = Query(None, description="Lọc theo trạng thái: todo, in_progress, done"),
    priority: Optional[str] = Query(None, description="Lọc theo độ ưu tiên: p1, p2, p3, p4"),
    is_completed: Optional[bool] = Query(None, description="Lọc công việc đã xong hoặc chưa"),
    search: Optional[str] = Query(None, description="Tìm kiếm theo tiêu đề hoặc mô tả"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    tasks = await crud_task.get_tasks(
        db=db,
        status=status,
        priority=priority,
        is_completed=is_completed,
        search=search,
        skip=skip,
        limit=limit
    )
    return tasks


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED, summary="Tạo công việc mới")
async def create_new_task(
    task_in: TaskCreate,
    db: AsyncSession = Depends(get_db)
):
    return await crud_task.create_task(db=db, task_in=task_in)


@router.get("/{task_id}", response_model=TaskResponse, summary="Xem chi tiết một công việc")
async def read_task(
    task_id: int,
    db: AsyncSession = Depends(get_db)
):
    db_task = await crud_task.get_task_by_id(db=db, task_id=task_id)
    if not db_task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy công việc")
    return db_task


@router.put("/{task_id}", response_model=TaskResponse, summary="Cập nhật công việc")
async def update_task(
    task_id: int,
    task_in: TaskUpdate,
    db: AsyncSession = Depends(get_db)
):
    db_task = await crud_task.get_task_by_id(db=db, task_id=task_id)
    if not db_task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy công việc")
    return await crud_task.update_task(db=db, db_task=db_task, task_in=task_in)


@router.patch("/{task_id}/toggle", response_model=TaskResponse, summary="Đánh dấu hoàn thành / chưa hoàn thành")
async def toggle_task(
    task_id: int,
    db: AsyncSession = Depends(get_db)
):
    db_task = await crud_task.get_task_by_id(db=db, task_id=task_id)
    if not db_task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy công việc")
    return await crud_task.toggle_task_completion(db=db, db_task=db_task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Xóa công việc")
async def delete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db)
):
    db_task = await crud_task.get_task_by_id(db=db, task_id=task_id)
    if not db_task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy công việc")
    await crud_task.delete_task(db=db, db_task=db_task)
    return None


# -------------------------------------------------------------
# Subtasks Endpoints
# -------------------------------------------------------------

@router.post("/{task_id}/subtasks", response_model=SubtaskResponse, status_code=status.HTTP_201_CREATED, summary="Thêm checklist con vào task")
async def add_subtask(
    task_id: int,
    subtask_in: SubtaskCreate,
    db: AsyncSession = Depends(get_db)
):
    db_task = await crud_task.get_task_by_id(db=db, task_id=task_id)
    if not db_task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy công việc cha")
    return await crud_task.create_subtask(db=db, task_id=task_id, title=subtask_in.title)


@router.patch("/{task_id}/subtasks/{subtask_id}/toggle", response_model=SubtaskResponse, summary="Tick checklist con")
async def toggle_subtask_status(
    task_id: int,
    subtask_id: int,
    db: AsyncSession = Depends(get_db)
):
    db_subtask = await crud_task.get_subtask_by_id(db=db, subtask_id=subtask_id)
    if not db_subtask or db_subtask.task_id != task_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy checklist con")
    return await crud_task.toggle_subtask(db=db, subtask=db_subtask)


@router.delete("/{task_id}/subtasks/{subtask_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Xóa checklist con")
async def delete_subtask_item(
    task_id: int,
    subtask_id: int,
    db: AsyncSession = Depends(get_db)
):
    db_subtask = await crud_task.get_subtask_by_id(db=db, subtask_id=subtask_id)
    if not db_subtask or db_subtask.task_id != task_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy checklist con")
    await crud_task.delete_subtask(db=db, subtask=db_subtask)
    return None


# -------------------------------------------------------------
# Pomodoro Log Endpoint
# -------------------------------------------------------------

@router.post("/{task_id}/pomodoro-log", response_model=TaskResponse, summary="Ghi nhận phiên Pomodoro hoàn thành")
async def log_pomodoro_session(
    task_id: int,
    req: PomodoroLogRequest,
    db: AsyncSession = Depends(get_db)
):
    db_task = await crud_task.get_task_by_id(db=db, task_id=task_id)
    if not db_task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy công việc")
    return await crud_task.log_pomodoro_minutes(db=db, db_task=db_task, minutes=req.minutes)
