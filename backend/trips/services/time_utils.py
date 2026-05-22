"""Datetime helpers for ELD trip planning and log generation."""

from __future__ import annotations

import math
from datetime import date, datetime, time, timedelta, timezone
from typing import Any, Union

DateTimeInput = Union[datetime, str, None]

MINUTES_PER_DAY = 24 * 60


def parse_datetime(value: DateTimeInput) -> datetime | None:
    """Parse and normalize a datetime from ISO string or datetime object."""
    if value is None:
        return None
    if isinstance(value, datetime):
        dt = value
    elif isinstance(value, str):
        cleaned = value.strip()
        if not cleaned:
            return None
        if cleaned.endswith('Z'):
            cleaned = cleaned[:-1] + '+00:00'
        dt = datetime.fromisoformat(cleaned)
    else:
        raise TypeError(f'Unsupported datetime type: {type(value)!r}')

    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def to_iso_string(value: DateTimeInput) -> str | None:
    """Convert a datetime input to an ISO 8601 string."""
    dt = parse_datetime(value)
    if dt is None:
        return None
    return dt.isoformat()


def duration_hours_between(start: DateTimeInput, end: DateTimeInput) -> float:
    """Return duration in hours between two datetimes."""
    start_dt = parse_datetime(start)
    end_dt = parse_datetime(end)
    if start_dt is None or end_dt is None:
        raise ValueError('start and end datetimes are required')
    if end_dt < start_dt:
        raise ValueError('end datetime must be on or after start datetime')
    seconds = (end_dt - start_dt).total_seconds()
    return round_hours(seconds / 3600)


def minutes_from_midnight(value: DateTimeInput) -> int:
    """Return whole minutes elapsed since local calendar midnight for the given datetime."""
    dt = parse_datetime(value)
    if dt is None:
        raise ValueError('datetime is required')
    return dt.hour * 60 + dt.minute


def format_hh_mm(minutes: int) -> str:
    """Format minutes since midnight as HH:mm (24:00 allowed for end-of-day)."""
    if minutes < 0:
        raise ValueError('minutes cannot be negative')
    if minutes == MINUTES_PER_DAY:
        return '24:00'
    hours = minutes // 60
    mins = minutes % 60
    return f'{hours:02d}:{mins:02d}'


def round_hours(value: float) -> float:
    """Round hours to two decimal places consistently."""
    return round(float(value), 2)


def _midnight_after(day: date) -> datetime:
    return datetime.combine(day + timedelta(days=1), time.min)


def split_at_midnight(
    start: DateTimeInput,
    end: DateTimeInput,
) -> list[dict[str, Any]]:
    """
    Split a datetime range into segments bounded by calendar midnights.

    Each segment contains: date (date), start (datetime), end (datetime).
    """
    start_dt = parse_datetime(start)
    end_dt = parse_datetime(end)
    if start_dt is None or end_dt is None:
        raise ValueError('start and end datetimes are required')
    if end_dt <= start_dt:
        raise ValueError('end datetime must be after start datetime')

    segments: list[dict[str, Any]] = []
    cursor = start_dt
    while cursor < end_dt:
        day = cursor.date()
        next_midnight = _midnight_after(day)
        segment_end = min(end_dt, next_midnight)
        segments.append({
            'date': day,
            'start': cursor,
            'end': segment_end,
        })
        cursor = segment_end
    return segments


def end_minutes_for_day(segment_end: datetime, day: date) -> int:
    """Return end minutes for a segment; 1440 when the segment ends at next midnight."""
    if segment_end.date() > day or (
        segment_end.date() == day + timedelta(days=1) and segment_end.time() == time.min
    ):
        return MINUTES_PER_DAY
    return minutes_from_midnight(segment_end)
