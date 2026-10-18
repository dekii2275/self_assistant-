import unittest
from datetime import datetime, timezone
from unittest.mock import patch

from app.core.email_reminders import EmailReminder, send_email_reminder


class FakeSMTP:
    instances = []

    def __init__(self, *args, **kwargs):
        self.messages = []
        self.logins = []
        self.tls_started = False
        self.instances.append(self)

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def starttls(self, **_kwargs):
        self.tls_started = True

    def login(self, username, password):
        self.logins.append((username, password))

    def send_message(self, message):
        self.messages.append(message)


class EmailReminderTests(unittest.TestCase):
    def test_smtp_message_has_recipient_due_time_and_uses_tls(self):
        FakeSMTP.instances.clear()
        reminder = EmailReminder(
            task_id=1,
            title="Ôn bài",
            due_date=datetime(2026, 10, 20, 2, 0, tzinfo=timezone.utc),
            minutes_before=60,
            recipient="me@example.com",
            claimed_at=datetime.now(timezone.utc),
        )
        with patch("app.core.email_reminders.smtplib.SMTP", FakeSMTP), \
             patch("app.core.email_reminders.settings.SMTP_HOST", "smtp.example.com"), \
             patch("app.core.email_reminders.settings.SMTP_PORT", 587), \
             patch("app.core.email_reminders.settings.SMTP_FROM_EMAIL", "sender@example.com"), \
             patch("app.core.email_reminders.settings.SMTP_USERNAME", "sender@example.com"), \
             patch("app.core.email_reminders.settings.SMTP_PASSWORD", "test-password"), \
             patch("app.core.email_reminders.settings.SMTP_SECURITY", "starttls"):
            send_email_reminder(reminder)

        smtp = FakeSMTP.instances[0]
        self.assertTrue(smtp.tls_started)
        self.assertEqual(smtp.logins, [("sender@example.com", "test-password")])
        self.assertEqual(smtp.messages[0]["To"], "me@example.com")
        self.assertIn("Ôn bài", smtp.messages[0].get_content())
        self.assertIn("20/10/2026 09:00", smtp.messages[0].get_content())


if __name__ == "__main__":
    unittest.main()
