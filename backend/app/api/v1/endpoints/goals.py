from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.crud import goal as crud_goal
from app.schemas.goal import GoalCreate, GoalResponse

router = APIRouter()


@router.get("", response_model=List[GoalResponse], summary="Lấy danh sách mục tiêu ngày")
async def read_goals(db: AsyncSession = Depends(get_db)):
    return await crud_goal.get_goals(db=db)


@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED, summary="Tạo mục tiêu mới")
async def create_goal(goal_in: GoalCreate, db: AsyncSession = Depends(get_db)):
    return await crud_goal.create_goal(db=db, goal_in=goal_in)


@router.patch("/{goal_id}/toggle", response_model=GoalResponse, summary="Đánh dấu hoàn thành mục tiêu")
async def toggle_goal(goal_id: int, db: AsyncSession = Depends(get_db)):
    db_goal = await crud_goal.toggle_goal(db=db, goal_id=goal_id)
    if not db_goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy mục tiêu")
    return db_goal


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Xóa mục tiêu")
async def delete_goal(goal_id: int, db: AsyncSession = Depends(get_db)):
    success = await crud_goal.delete_goal(db=db, goal_id=goal_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy mục tiêu")
    return None
