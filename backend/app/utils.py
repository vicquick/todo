import calendar
from datetime import datetime, timedelta


def advance_deadline(base: datetime, rule: str) -> datetime:
    """Next occurrence for a recurrence rule, calendar-aware for months."""
    if rule == "daily":
        return base + timedelta(days=1)
    if rule == "weekly":
        return base + timedelta(weeks=1)
    year = base.year + (1 if base.month == 12 else 0)
    month = 1 if base.month == 12 else base.month + 1
    last_day = calendar.monthrange(year, month)[1]
    if rule == "monthly_last":
        return base.replace(year=year, month=month, day=last_day)
    return base.replace(year=year, month=month, day=min(base.day, last_day))


def normalize_tags(tags: list[str] | None) -> list[str]:
    if not tags:
        return []
    normalized = []
    for tag in tags:
        cleaned = tag.strip().lower()
        if cleaned:
            normalized.append(cleaned)
    return list(dict.fromkeys(normalized))
