from datetime import datetime, timedelta
from typing import Optional, Sequence
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task, Subtask, StatusEnum, RecurrenceEnum
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

    # Order by is_completed (incomplete first), then priority, then created_at desc
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
        actual_minutes=task_in.actual_minutes,
        recurrence_rule=task_in.recurrence_rule,
        tags=task_in.tags,
        is_completed=task_in.status == StatusEnum.DONE.value
    )
    db.add(db_task)
    await db.flush()

    # Create initial subtasks if provided
    if task_in.subtask_titles:
        for st_title in task_in.subtask_titles:
            if st_title.strip():
                subtask = Subtask(task_id=db_task.id, title=st_title.strip(), is_completed=False)
                db.add(subtask)

    await db.commit()
    await db.refresh(db_task)
    return db_task


async def update_task(db: AsyncSession, db_task: Task, task_in: TaskUpdate) -> Task:
    update_data = task_in.model_dump(exclude_unset=True)
    
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


def calculate_next_recurrence_date(base_date: Optional[datetime], rule: str) -> datetime:
    start = base_date or datetime.now()
    if rule == RecurrenceEnum.DAILY.value:
        return start + timedelta(days=1)
    elif rule == RecurrenceEnum.WEEKDAYS.value:
        # If Friday (4) -> next Monday (+3 days), Saturday (5) -> +2 days
        next_day = start + timedelta(days=1)
        while next_day.weekday() >= 5:  # Saturday or Sunday
            next_day += timedelta(days=1)
        return next_day
    elif rule == RecurrenceEnum.WEEKLY.value:
        return start + timedelta(weeks=1)
    elif rule == RecurrenceEnum.MONTHLY.value:
        return start + timedelta(days=30)
    return start + timedelta(days=1)


async def toggle_task_completion(db: AsyncSession, db_task: Task) -> Task:
    was_completed = db_task.is_completed
    db_task.is_completed = not was_completed
    db_task.status = StatusEnum.DONE.value if db_task.is_completed else StatusEnum.TODO.value

    # Auto spawn next recurrence task when marked DONE
    if not was_completed and db_task.is_completed and db_task.recurrence_rule:
        next_due = calculate_next_recurrence_date(db_task.due_date, db_task.recurrence_rule)
        next_task = Task(
            title=db_task.title,
            description=db_task.description,
            priority=db_task.priority,
            status=StatusEnum.TODO.value,
            due_date=next_due,
            estimated_minutes=db_task.estimated_minutes,
            actual_minutes=0,
            recurrence_rule=db_task.recurrence_rule,
            tags=db_task.tags,
            is_completed=False,
        )
        db.add(next_task)
        await db.flush()

        # Duplicate subtask templates as uncompleted for the next task
        for st in db_task.subtasks:
            db.add(Subtask(task_id=next_task.id, title=st.title, is_completed=False))

    await db.commit()
    await db.refresh(db_task)
    return db_task


# -------------------------------------------------------------
# Subtasks CRUD
# -------------------------------------------------------------

async def create_subtask(db: AsyncSession, task_id: int, title: str) -> Subtask:
    subtask = Subtask(task_id=task_id, title=title.strip(), is_completed=False)
    db.add(subtask)
    await db.commit()
    await db.refresh(subtask)
    return subtask


async def get_subtask_by_id(db: AsyncSession, subtask_id: int) -> Optional[Subtask]:
    stmt = select(Subtask).where(Subtask.id == subtask_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def toggle_subtask(db: AsyncSession, subtask: Subtask) -> Subtask:
    subtask.is_completed = not subtask.is_completed
    await db.commit()
    await db.refresh(subtask)
    return subtask


async def delete_subtask(db: AsyncSession, subtask: Subtask) -> bool:
    await db.delete(subtask)
    await db.commit()
    return True


# -------------------------------------------------------------
# Pomodoro Log
# -------------------------------------------------------------

async def log_pomodoro_minutes(db: AsyncSession, db_task: Task, minutes: int) -> Task:
    db_task.actual_minutes = (db_task.actual_minutes or 0) + minutes
    await db.commit()
    await db.refresh(db_task)
    return db_task
