"""Daily ELD log sheet generator from duty-status events."""

from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, time, timedelta
from typing import Any

from .time_utils import (
    MINUTES_PER_DAY,
    duration_hours_between,
    end_minutes_for_day,
    format_hh_mm,
    minutes_from_midnight,
    parse_datetime,
    round_hours,
    split_at_midnight,
)

STATUS_OFF_DUTY = 'off_duty'
STATUS_SLEEPER = 'sleeper_berth'
STATUS_DRIVING = 'driving'
STATUS_ON_DUTY = 'on_duty_not_driving'

STATUS_KEYS = (
    STATUS_OFF_DUTY,
    STATUS_SLEEPER,
    STATUS_DRIVING,
    STATUS_ON_DUTY,
)

FORM_FIELDS = (
    'driver_name',
    'carrier_name',
    'main_office_address',
    'vehicle_number',
    'trailer_number',
    'shipping_document',
)


def generate_daily_logs(events: list[dict], trip_metadata: dict | None = None) -> list[dict]:
    """
    Convert HOS duty events into one ELD daily log sheet per calendar day.

    Splits events at midnight, fills gaps with off_duty time, counts driving miles
    only from driving events, and normalizes each day's status totals to 24 hours.
    """
    metadata = trip_metadata or {}
    day_segments = _split_events_by_day(events)
    daily_logs: list[dict] = []

    for day in sorted(day_segments.keys()):
        timeline = _fill_gaps(day_segments[day], day)
        output_events = [_segment_to_event(segment, day) for segment in timeline]
        totals = _calculate_totals(output_events)
        totals = _normalize_totals_to_24(totals)
        remarks = _build_remarks_from_segments(timeline)
        total_miles = _sum_driving_miles(output_events)

        daily_logs.append({
            'date': day.isoformat(),
            'total_miles': round_hours(total_miles),
            'events': output_events,
            'totals': totals,
            'remarks': remarks,
            'form': {field: metadata.get(field, '') for field in FORM_FIELDS},
        })

    return daily_logs


def _split_events_by_day(events: list[dict]) -> dict[date, list[dict]]:
    """Split input events at midnight and group segments by calendar date."""
    grouped: dict[date, list[dict]] = defaultdict(list)

    for event in events:
        start_dt = parse_datetime(event['start_datetime'])
        end_dt = parse_datetime(event['end_datetime'])
        if start_dt is None or end_dt is None:
            raise ValueError('Each event requires start_datetime and end_datetime')

        total_duration = duration_hours_between(start_dt, end_dt)
        total_miles = float(event.get('distance_miles', 0) or 0)
        segments = split_at_midnight(start_dt, end_dt)

        for index, segment in enumerate(segments):
            seg_duration = duration_hours_between(segment['start'], segment['end'])
            ratio = seg_duration / total_duration if total_duration > 0 else 0
            seg_miles = round_hours(total_miles * ratio) if event.get('type') == 'driving' else 0.0

            grouped[segment['date']].append({
                'type': event.get('type', ''),
                'status': event.get('status', STATUS_OFF_DUTY),
                'start': segment['start'],
                'end': segment['end'],
                'duration_hours': seg_duration,
                'distance_miles': seg_miles,
                'location': event.get('location', ''),
                'remark': event.get('remark', ''),
                'is_gap_fill': False,
            })

    for day in grouped:
        grouped[day].sort(key=lambda item: item['start'])
    return grouped


def _fill_gaps(segments: list[dict], day: date) -> list[dict]:
    """Insert off_duty segments so the day timeline covers midnight to midnight."""
    day_start = datetime.combine(day, time.min)
    day_end = datetime.combine(day + timedelta(days=1), time.min)
    timeline: list[dict] = []
    cursor = day_start

    for segment in segments:
        if segment['start'] > cursor:
            timeline.append(_gap_segment(cursor, segment['start']))
        timeline.append(segment)
        cursor = segment['end']

    if cursor < day_end:
        timeline.append(_gap_segment(cursor, day_end))

    return timeline


def _gap_segment(start: datetime, end: datetime) -> dict:
    """Create an off_duty gap-filler segment."""
    return {
        'type': 'off_duty',
        'status': STATUS_OFF_DUTY,
        'start': start,
        'end': end,
        'duration_hours': duration_hours_between(start, end),
        'distance_miles': 0.0,
        'location': '',
        'remark': '',
        'is_gap_fill': True,
    }


def _segment_to_event(segment: dict, day: date) -> dict:
    """Convert an internal timeline segment to a daily log event dict."""
    start_minutes = minutes_from_midnight(segment['start'])
    end_minutes = end_minutes_for_day(segment['end'], day)
    duration = round_hours(duration_hours_between(segment['start'], segment['end']))

    return {
        'type': segment['type'],
        'status': segment['status'],
        'start_time': format_hh_mm(start_minutes),
        'end_time': format_hh_mm(end_minutes),
        'start_minutes': start_minutes,
        'end_minutes': end_minutes,
        'duration_hours': duration,
        'distance_miles': round_hours(segment.get('distance_miles', 0)),
        'remark': segment.get('remark', ''),
    }


def _calculate_totals(events: list[dict]) -> dict[str, float]:
    """Sum duration hours by duty status."""
    totals = {status: 0.0 for status in STATUS_KEYS}
    for event in events:
        status = event.get('status', STATUS_OFF_DUTY)
        if status in totals:
            totals[status] = round_hours(totals[status] + event['duration_hours'])
    totals['total'] = 24.0
    return totals


def _normalize_totals_to_24(totals: dict[str, float]) -> dict[str, float]:
    """Round status totals and adjust off_duty so the day sums to exactly 24 hours."""
    rounded = {status: round_hours(totals[status]) for status in STATUS_KEYS}
    status_sum = round_hours(sum(rounded.values()))
    difference = round_hours(24.0 - status_sum)
    if difference != 0:
        rounded[STATUS_OFF_DUTY] = round_hours(rounded[STATUS_OFF_DUTY] + difference)
    rounded['total'] = 24.0
    return rounded


def _sum_driving_miles(events: list[dict]) -> float:
    """Sum miles only from driving-type events."""
    return round_hours(
        sum(
            event['distance_miles']
            for event in events
            if event.get('type') == 'driving'
        )
    )


def _build_remarks_from_segments(segments: list[dict]) -> list[str]:
    """Build human-readable remark lines for non-gap duty changes."""
    remarks: list[str] = []
    for segment in segments:
        if segment.get('is_gap_fill'):
            continue
        text = segment.get('remark', '').strip()
        if not text:
            location = segment.get('location', '').strip()
            event_type = segment.get('type', 'duty').replace('_', ' ').title()
            text = f'{event_type} at {location}' if location else event_type
        start_time = format_hh_mm(minutes_from_midnight(segment['start']))
        remarks.append(f'{start_time} - {text}')
    return remarks
