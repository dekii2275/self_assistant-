import asyncio
import unittest
from datetime import datetime, timezone
from types import SimpleNamespace

from pydantic import ValidationError

from app.crud.task import _create_next_recurrence
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate


class ReminderTests(unittest.TestCase):
    def test_reminder_requires_due_date_and_supported_offset(self):
        due = datetime(2026, 10, 20, 9, 0, tzinfo=timezone.utc)
        for minutes in (10, 60, 1440):
            with self.subTest(minutes=minutes):
                task = TaskCreate(title="Ôn bài", due_date=due, reminder_minutes_before=minutes)
                self.assertEqual(task.reminder_minutes_before, minutes)

        with self.assertRaises(ValidationError):
            TaskCreate(title="Ôn bài", reminder_minutes_before=10)
        with self.assertRaises(ValidationError):
            TaskCreate(title="Ôn bài", due_date=due, reminder_minutes_before=5)
        with self.assertRaises(ValidationError):
            TaskUpdate(due_date=None, reminder_minutes_before=1440)
        with self.assertRaises(ValidationError):
            TaskCreate(title="Ôn bài", due_date=due, reminder_minutes_before=10, email_reminder_to="bad-email")
        with self.assertRaises(ValidationError):
            TaskCreate(title="Ôn bài", due_date=due, email_reminder_to="me@example.com")
        task = TaskCreate(title="Ôn bài", due_date=due, reminder_minutes_before=10, email_reminder_to="me@example.com")
        self.assertEqual(task.email_reminder_to, "me@example.com")

    def test_recurrence_keeps_reminder_but_not_delivery_state(self):
        class FakeSession:
            def __init__(self):
                self.added = []

            def add(self, value):
                self.added.append(value)

            async def flush(self):
                self.added[0].id = 101

        session = FakeSession()
        original = SimpleNamespace(
            title="Ôn bài",
            description=None,
            priority="p2",
            due_date=datetime(2099, 10, 20, 9, 0, tzinfo=timezone.utc),
            estimated_minutes=30,
            recurrence_rule="daily",
            reminder_minutes_before=60,
            reminder_sent_at=datetime.now(timezone.utc),
            email_reminder_to="me@example.com",
            email_reminder_sent_at=datetime.now(timezone.utc),
            tags=None,
            subtasks=[],
        )

        asyncio.run(_create_next_recurrence(session, original))
        next_task = session.added[0]
        self.assertIsInstance(next_task, Task)
        self.assertEqual(next_task.reminder_minutes_before, 60)
        self.assertIsNone(next_task.reminder_sent_at)
        self.assertEqual(next_task.email_reminder_to, "me@example.com")
        self.assertIsNone(next_task.email_reminder_sent_at)
        self.assertEqual(next_task.due_date, datetime(2099, 10, 21, 9, 0, tzinfo=timezone.utc))


if __name__ == "__main__":
    unittest.main()
