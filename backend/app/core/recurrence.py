import calendar
from datetime import datetime, timedelta


def _advance(date: datetime, rule: str) -> datetime:
    if rule == "daily":
        return date + timedelta(days=1)
    if rule == "weekdays":
        next_day = date + timedelta(days=1)
        while next_day.weekday() >= 5:
            next_day += timedelta(days=1)
        return next_day
    if rule == "weekly":
        return date + timedelta(weeks=1)
    if rule == "monthly":
        year = date.year + (date.month == 12)
        month = date.month % 12 + 1
        last_day = calendar.monthrange(year, month)[1]
        current_last_day = calendar.monthrange(date.year, date.month)[1]
        day = last_day if date.day == current_last_day else min(date.day, last_day)
        return date.replace(year=year, month=month, day=day)
    raise ValueError(f"Unsupported recurrence rule: {rule}")


def calculate_next_recurrence_date(
    base_date: datetime | None, rule: str, now: datetime | None = None
) -> datetime:
    start = base_date or now or datetime.now()
    reference = now or datetime.now(start.tzinfo)
    next_date = _advance(start, rule)
    while next_date <= reference:
        next_date = _advance(next_date, rule)
    return next_date
