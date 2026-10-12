from typing import Optional, Sequence
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task, StatusEnum
from app.schemas.task import TaskCreate, TaskUpdate


async def get_tasks(
    db: AsyncSession,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    is_completed: Optional[bool] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Sequence[Task]:
    stmt = select(Task)

    if status is not None:
        stmt = stmt.where(Task.status == status)
    if priority is not None:
        stmt = stmt.where(Task.priority == priority)
    if is_completed is not None:
        stmt = stmt.where(Task.is_completed == is_completed)
    if search:
        search_filter = f"%{search}%"
        stmt = stmt.where(
            or_(
                Task.title.ilike(search_filter),
                Task.description.ilike(search_filter),
                Task.tags.ilike(search_filter)
            )
        )

    # Order by is_completed (incomplete first), then priority asc, then created_at desc
    stmt = stmt.order_by(Task.is_completed.asc(), Task.priority.asc(), Task.created_at.desc())
    stmt = stmt.offset(skip).limit(limit)

    result = await db.execute(stmt)
    return result.scalars().all()


async def get_task_by_id(db: AsyncSession, task_id: int) -> Optional[Task]:
    stmt = select(Task).where(Task.id == task_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def create_task(db: AsyncSession, task_in: TaskCreate) -> Task:
    db_task = Task(
        title=task_in.title,
        description=task_in.description,
        priority=task_in.priority,
        status=task_in.status,
        due_date=task_in.due_date,
        estimated_minutes=task_in.estimated_minutes,
        tags=task_in.tags,
        is_completed=task_in.status == StatusEnum.DONE.value
    )
    db.add(db_task)
    await db.commit()
    await db.refresh(db_task)
    return db_task


async def update_task(db: AsyncSession, db_task: Task, task_in: TaskUpdate) -> Task:
    update_data = task_in.model_dump(exclude_unset=True)
    
    # Auto sync status and is_completed if one changes
    if "is_completed" in update_data and "status" not in update_data:
        update_data["status"] = StatusEnum.DONE.value if update_data["is_completed"] else StatusEnum.TODO.value
    elif "status" in update_data and "is_completed" not in update_data:
        update_data["is_completed"] = (update_data["status"] == StatusEnum.DONE.value)

    for field, value in update_data.items():
        setattr(db_task, field, value)

    await db.commit()
    await db.refresh(db_task)
    return db_task


async def delete_task(db: AsyncSession, db_task: Task) -> bool:
    await db.delete(db_task)
    await db.commit()
    return True


async def toggle_task_completion(db: AsyncSession, db_task: Task) -> Task:
    db_task.is_completed = not db_task.is_completed
    db_task.status = StatusEnum.DONE.value if db_task.is_completed else StatusEnum.TODO.value
    await db.commit()
    await db.refresh(db_task)
    return db_task
