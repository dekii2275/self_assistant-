import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.database import Base, engine
from app.core.email_reminders import email_reminder_loop


from sqlalchemy import text


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Khởi tạo bảng cơ sở dữ liệu nếu chưa tồn tại
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_minutes INTEGER DEFAULT 0 NOT NULL;"))
        await conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_rule VARCHAR(50);"))
        await conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_minutes_before INTEGER;"))
        await conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;"))
        await conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS email_reminder_to VARCHAR(320);"))
        await conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS email_reminder_sent_at TIMESTAMP WITH TIME ZONE;"))
        await conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS email_reminder_claimed_at TIMESTAMP WITH TIME ZONE;"))
    reminder_worker = asyncio.create_task(email_reminder_loop())
    try:
        yield
    finally:
        reminder_worker.cancel()
        try:
            await reminder_worker
        except asyncio.CancelledError:
            pass
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API cho ứng dụng Trợ lý cá nhân & To-Do List",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }
