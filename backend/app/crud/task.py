from datetime import datetime, timedelta, timezone
from typing import Optional, Sequence
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task, Subtask, StatusEnum
from app.schemas.task import TaskCreate, TaskUpdate
from app.core.recurrence import calculate_next_recurrence_date


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
        reminder_minutes_before=task_in.reminder_minutes_before,
        email_reminder_to=task_in.email_reminder_to,
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
    was_completed = db_task.is_completed
    
    if "is_completed" in update_data and "status" not in update_data:
        update_data["status"] = StatusEnum.DONE.value if update_data["is_completed"] else StatusEnum.TODO.value
    elif "status" in update_data and "is_completed" not in update_data:
        update_data["is_completed"] = (update_data["status"] == StatusEnum.DONE.value)

    next_due_date = update_data.get("due_date", db_task.due_date)
    next_reminder = update_data.get("reminder_minutes_before", db_task.reminder_minutes_before)
    next_email = update_data.get("email_reminder_to", db_task.email_reminder_to)
    if next_reminder is not None and next_due_date is None:
        raise ValueError("A due date is required for a reminder")
    if next_email is not None and next_reminder is None:
        raise ValueError("A reminder is required for email delivery")
    if (
        ("due_date" in update_data and update_data["due_date"] != db_task.due_date)
        or ("reminder_minutes_before" in update_data and next_reminder != db_task.reminder_minutes_before)
    ):
        db_task.reminder_sent_at = None
    if (
        ("due_date" in update_data and update_data["due_date"] != db_task.due_date)
        or ("reminder_minutes_before" in update_data and next_reminder != db_task.reminder_minutes_before)
        or ("email_reminder_to" in update_data and next_email != db_task.email_reminder_to)
    ):
        db_task.email_reminder_sent_at = None
        db_task.email_reminder_claimed_at = None

    for field, value in update_data.items():
        setattr(db_task, field, value)

    if not was_completed and db_task.is_completed and db_task.recurrence_rule:
        await _create_next_recurrence(db, db_task)

    await db.commit()
    await db.refresh(db_task)
    return db_task


async def delete_task(db: AsyncSession, db_task: Task) -> bool:
    await db.delete(db_task)
    await db.commit()
    return True


async def _create_next_recurrence(db: AsyncSession, db_task: Task) -> None:
    next_due = calculate_next_recurrence_date(db_task.due_date, db_task.recurrence_rule)
    next_task = Task(
        title=db_task.title,
        description=db_task.description,
        priority=db_task.priority,
        status=StatusEnum.TODO.value,
        due_date=next_due,
        reminder_minutes_before=db_task.reminder_minutes_before,
        email_reminder_to=db_task.email_reminder_to,
        estimated_minutes=db_task.estimated_minutes,
        actual_minutes=0,
        recurrence_rule=db_task.recurrence_rule,
        tags=db_task.tags,
        is_completed=False,
    )
    db.add(next_task)
    await db.flush()

    for st in db_task.subtasks:
        db.add(Subtask(task_id=next_task.id, title=st.title, is_completed=False))


async def toggle_task_completion(db: AsyncSession, db_task: Task) -> Task:
    was_completed = db_task.is_completed
    db_task.is_completed = not was_completed
    db_task.status = StatusEnum.DONE.value if db_task.is_completed else StatusEnum.TODO.value

    if not was_completed and db_task.is_completed and db_task.recurrence_rule:
        await _create_next_recurrence(db, db_task)

    await db.commit()
    await db.refresh(db_task)
    return db_task


async def claim_due_reminders(db: AsyncSession, limit: int = 20) -> Sequence[Task]:
    """Claim reminders once across tabs while leaving a day to catch up after downtime."""
    now = datetime.now(timezone.utc)
    due_within = or_(*(
        and_(Task.reminder_minutes_before == minutes, Task.due_date <= now + timedelta(minutes=minutes))
        for minutes in (10, 60, 1440)
    ))
    stmt = (
        select(Task)
        .where(
            Task.is_completed.is_(False),
            Task.reminder_sent_at.is_(None),
            Task.due_date.is_not(None),
            Task.due_date >= now - timedelta(days=1),
            due_within,
        )
        .order_by(Task.due_date.asc())
        .limit(limit)
        .with_for_update(skip_locked=True)
    )
    result = await db.execute(stmt)
    tasks = result.scalars().all()
    for task in tasks:
        task.reminder_sent_at = now
    if tasks:
        await db.commit()
        for task in tasks:
            await db.refresh(task, attribute_names=["updated_at"])
    return tasks


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
