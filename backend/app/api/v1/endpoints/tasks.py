from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.crud import task as crud_task
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate

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
