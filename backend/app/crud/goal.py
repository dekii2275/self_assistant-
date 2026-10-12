from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.goal import Goal
from app.schemas.goal import GoalCreate


async def get_goals(db: AsyncSession) -> List[Goal]:
    query = select(Goal).order_by(Goal.id.asc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def create_goal(db: AsyncSession, goal_in: GoalCreate) -> Goal:
    db_goal = Goal(title=goal_in.title, is_completed=False)
    db.add(db_goal)
    await db.commit()
    await db.refresh(db_goal)
    return db_goal


async def toggle_goal(db: AsyncSession, goal_id: int) -> Optional[Goal]:
    result = await db.execute(select(Goal).where(Goal.id == goal_id))
    db_goal = result.scalar_one_or_none()
    if not db_goal:
        return None
    db_goal.is_completed = not db_goal.is_completed
    await db.commit()
    await db.refresh(db_goal)
    return db_goal


async def delete_goal(db: AsyncSession, goal_id: int) -> bool:
    result = await db.execute(select(Goal).where(Goal.id == goal_id))
    db_goal = result.scalar_one_or_none()
    if not db_goal:
        return False
    await db.delete(db_goal)
    await db.commit()
    return True
