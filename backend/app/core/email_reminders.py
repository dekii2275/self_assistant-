"""Background SMTP delivery for task reminders."""

import asyncio
import logging
import smtplib
import ssl
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from zoneinfo import ZoneInfo

from sqlalchemy import and_, or_, select, update

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.task import Task

logger = logging.getLogger(__name__)
REMINDER_OFFSETS = (10, 60, 1440)


@dataclass(frozen=True)
class EmailReminder:
    task_id: int
    title: str
    due_date: datetime
    minutes_before: int
    recipient: str
    claimed_at: datetime


async def claim_due_email_reminders(limit: int = 20) -> list[EmailReminder]:
    now = datetime.now(timezone.utc)
    due_within = or_(*(
        and_(Task.reminder_minutes_before == minutes, Task.due_date <= now + timedelta(minutes=minutes))
        for minutes in REMINDER_OFFSETS
    ))
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Task)
            .where(
                Task.is_completed.is_(False),
                Task.email_reminder_to.is_not(None),
                Task.email_reminder_sent_at.is_(None),
                or_(
                    Task.email_reminder_claimed_at.is_(None),
                    Task.email_reminder_claimed_at <= now - timedelta(minutes=5),
                ),
                Task.due_date.is_not(None),
                Task.due_date >= now - timedelta(days=1),
                due_within,
            )
            .order_by(Task.due_date.asc())
            .limit(limit)
            .with_for_update(skip_locked=True)
        )
        tasks = result.scalars().all()
        reminders = []
        for task in tasks:
            task.email_reminder_claimed_at = now
            reminders.append(EmailReminder(
                task_id=task.id,
                title=task.title,
                due_date=task.due_date,
                minutes_before=task.reminder_minutes_before,
                recipient=task.email_reminder_to,
                claimed_at=now,
            ))
        if tasks:
            await db.commit()
        return reminders


def send_email_reminder(reminder: EmailReminder) -> None:
    due_local = reminder.due_date.astimezone(ZoneInfo(settings.REMINDER_TIMEZONE))
    message = EmailMessage()
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = reminder.recipient
    message["Subject"] = "Nhắc việc trước hạn - Self Assistant"
    message.set_content(
        f"Nhiệm vụ: {reminder.title}\n"
        f"Hạn chót: {due_local:%d/%m/%Y %H:%M} ({settings.REMINDER_TIMEZONE})\n"
        f"Nhắc trước: {reminder.minutes_before} phút\n\n"
        "Mở Self Assistant để xem hoặc hoàn thành nhiệm vụ.\n"
    )

    if settings.SMTP_SECURITY == "ssl":
        client = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15, context=ssl.create_default_context())
    else:
        client = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
    with client:
        if settings.SMTP_SECURITY == "starttls":
            client.starttls(context=ssl.create_default_context())
        if settings.SMTP_USERNAME:
            client.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        client.send_message(message)


async def mark_email_reminder_sent(reminder: EmailReminder) -> None:
    async with AsyncSessionLocal() as db:
        await db.execute(
            update(Task)
            .where(Task.id == reminder.task_id, Task.email_reminder_claimed_at == reminder.claimed_at)
            .values(email_reminder_sent_at=datetime.now(timezone.utc), email_reminder_claimed_at=None)
        )
        await db.commit()


async def deliver_email_reminders() -> None:
    for reminder in await claim_due_email_reminders():
        try:
            await asyncio.to_thread(send_email_reminder, reminder)
            await mark_email_reminder_sent(reminder)
        except Exception:
            logger.exception("Email reminder failed for task %s; retrying in five minutes", reminder.task_id)


async def email_reminder_loop() -> None:
    while True:
        if settings.email_reminders_configured:
            try:
                await deliver_email_reminders()
            except Exception:
                logger.exception("Email reminder scan failed")
        await asyncio.sleep(30)
