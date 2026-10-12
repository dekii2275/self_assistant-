from fastapi import APIRouter
from app.api.v1.endpoints import health, tasks, goals

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
api_router.include_router(goals.router, prefix="/goals", tags=["Goals"])
