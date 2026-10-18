import unittest
from datetime import datetime, timezone

from app.core.recurrence import calculate_next_recurrence_date


class RecurrenceTests(unittest.TestCase):
    def test_month_end_follows_calendar(self):
        january = datetime(2025, 1, 31, 18, 0, tzinfo=timezone.utc)
        february = calculate_next_recurrence_date(
            january, "monthly", datetime(2025, 1, 31, 19, 0, tzinfo=timezone.utc)
        )
        march = calculate_next_recurrence_date(
            february, "monthly", datetime(2025, 2, 28, 19, 0, tzinfo=timezone.utc)
        )
        self.assertEqual(february, datetime(2025, 2, 28, 18, 0, tzinfo=timezone.utc))
        self.assertEqual(march, datetime(2025, 3, 31, 18, 0, tzinfo=timezone.utc))

    def test_overdue_daily_skips_missed_occurrences(self):
        result = calculate_next_recurrence_date(
            datetime(2025, 1, 1, 9, 0), "daily", datetime(2025, 1, 5, 12, 0)
        )
        self.assertEqual(result, datetime(2025, 1, 6, 9, 0))

    def test_weekdays_skip_weekend(self):
        result = calculate_next_recurrence_date(
            datetime(2025, 1, 3, 9, 0), "weekdays", datetime(2025, 1, 3, 12, 0)
        )
        self.assertEqual(result, datetime(2025, 1, 6, 9, 0))

    def test_invalid_rule_fails(self):
        with self.assertRaises(ValueError):
            calculate_next_recurrence_date(
                datetime(2025, 1, 1), "yearly", datetime(2025, 1, 1)
            )


if __name__ == "__main__":
    unittest.main()
