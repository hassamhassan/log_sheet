"""Hours-of-Service scheduler for converting route segments into duty events."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

from .constants import (
    BREAK_AFTER_DRIVING_HOURS,
    BREAK_DURATION_HOURS,
    CYCLE_LIMIT_HOURS,
    CYCLE_RESTART_HOURS,
    DAILY_RESET_HOURS,
    DEFAULT_AVERAGE_SPEED_MPH,
    DROPOFF_DURATION_HOURS,
    FUEL_DURATION_HOURS,
    FUEL_INTERVAL_MILES,
    HOURS_EPSILON,
    MAX_DRIVING_HOURS,
    MAX_DUTY_WINDOW_HOURS,
    PICKUP_DURATION_HOURS,
)
from .time_utils import parse_datetime, round_hours, to_iso_string

STOP_EVENT_TYPES = frozenset({
    'pickup', 'dropoff', 'fuel', 'break', 'rest', 'restart',
})


@dataclass
class HOSScheduler:
    """Stateful HOS event builder for a multi-segment route."""

    start_datetime: datetime
    current_cycle_used_hours: float
    events: list[dict[str, Any]] = field(default_factory=list)
    stops: list[dict[str, Any]] = field(default_factory=list)
    cursor: datetime | None = None
    shift_driving_hours: float = 0.0
    shift_duty_window_hours: float = 0.0
    driving_since_break: float = 0.0
    miles_since_fuel: float = 0.0
    total_miles: float = 0.0
    total_driving_hours: float = 0.0
    total_on_duty_hours: float = 0.0

    def __post_init__(self) -> None:
        self.cursor = parse_datetime(self.start_datetime)
        if self.cursor is None:
            raise ValueError('start_datetime is required')
        self.current_cycle_used_hours = round_hours(self.current_cycle_used_hours)

    def remaining_cycle_hours(self) -> float:
        return round_hours(max(0.0, CYCLE_LIMIT_HOURS - self.current_cycle_used_hours))

    def process_segments(self, route_segments: list[dict]) -> dict[str, Any]:
        """Schedule all route segments and return events, stops, and summary."""
        for segment in route_segments:
            self._process_segment(segment)

        return {
            'events': self.events,
            'stops': self.stops,
            'summary': {
                'total_miles': round_hours(self.total_miles),
                'total_driving_hours': round_hours(self.total_driving_hours),
                'total_on_duty_hours': round_hours(self.total_on_duty_hours),
                'current_cycle_used_hours': round_hours(self.current_cycle_used_hours),
                'remaining_cycle_hours': self.remaining_cycle_hours(),
                'estimated': True,
            },
        }

    def _process_segment(self, segment: dict) -> None:
        segment_type = segment.get('type', '')
        from_location = segment.get('from_location', '')
        to_location = segment.get('to_location', '')
        distance_miles = float(segment.get('distance_miles', 0) or 0)
        duration_hours = float(segment.get('duration_hours', 0) or 0)

        if duration_hours <= 0 and distance_miles > 0:
            duration_hours = round_hours(distance_miles / DEFAULT_AVERAGE_SPEED_MPH)
        elif duration_hours <= 0:
            return

        self._schedule_driving(
            distance_miles=distance_miles,
            duration_hours=duration_hours,
            from_location=from_location,
            to_location=to_location,
        )

        if segment_type == 'current_to_pickup':
            self._schedule_pickup(to_location)
        elif segment_type == 'pickup_to_dropoff':
            self._schedule_dropoff(to_location)

    def _schedule_driving(
        self,
        distance_miles: float,
        duration_hours: float,
        from_location: str,
        to_location: str,
    ) -> None:
        remaining_hours = duration_hours
        remaining_miles = distance_miles

        while remaining_hours > HOURS_EPSILON:
            self._ensure_shift_available()
            self._apply_break_if_needed()
            self._apply_fuel_if_needed(location=to_location or from_location)

            chunk_hours = self._max_driving_chunk_hours(
                remaining_hours=remaining_hours,
                remaining_miles=remaining_miles,
            )
            if chunk_hours <= HOURS_EPSILON:
                break

            self._ensure_cycle_available(chunk_hours)

            if remaining_hours > HOURS_EPSILON:
                chunk_miles = round_hours(remaining_miles * (chunk_hours / remaining_hours))
            else:
                chunk_miles = 0.0
            chunk_miles = min(chunk_miles, remaining_miles)

            location = to_location or from_location
            remark = f'Driving from {from_location} to {to_location}'.strip()
            self._append_event(
                event_type='driving',
                status='driving',
                duration_hours=chunk_hours,
                location=location,
                remark=remark,
                distance_miles=chunk_miles,
                counts_toward_cycle=True,
                counts_as_driving=True,
            )

            remaining_hours = round_hours(remaining_hours - chunk_hours)
            remaining_miles = round_hours(max(0.0, remaining_miles - chunk_miles))

    def _max_driving_chunk_hours(
        self,
        remaining_hours: float,
        remaining_miles: float,
    ) -> float:
        """Return the maximum legal driving chunk for the current shift state."""
        limits = [
            remaining_hours,
            MAX_DRIVING_HOURS - self.shift_driving_hours,
            MAX_DUTY_WINDOW_HOURS - self.shift_duty_window_hours,
        ]

        if self.driving_since_break < BREAK_AFTER_DRIVING_HOURS:
            limits.append(BREAK_AFTER_DRIVING_HOURS - self.driving_since_break)

        if remaining_miles > HOURS_EPSILON and self.miles_since_fuel < FUEL_INTERVAL_MILES:
            miles_until_fuel = FUEL_INTERVAL_MILES - self.miles_since_fuel
            if miles_until_fuel <= remaining_miles:
                limits.append(
                    remaining_hours * (miles_until_fuel / remaining_miles)
                )

        return max(0.0, min(limits))

    def _ensure_cycle_available(self, hours_needed: float = 0) -> None:
        if (
            self.current_cycle_used_hours >= CYCLE_LIMIT_HOURS
            or hours_needed > self.remaining_cycle_hours()
        ):
            self._append_restart()

    def _ensure_shift_available(self) -> None:
        if (
            self.shift_driving_hours >= MAX_DRIVING_HOURS
            or self.shift_duty_window_hours >= MAX_DUTY_WINDOW_HOURS
        ):
            self._append_rest()

    def _apply_break_if_needed(self) -> None:
        if self.driving_since_break >= BREAK_AFTER_DRIVING_HOURS:
            self._append_break()

    def _apply_fuel_if_needed(self, location: str) -> None:
        if self.miles_since_fuel >= FUEL_INTERVAL_MILES:
            self._append_fuel(location)

    def _schedule_pickup(self, location: str) -> None:
        self._ensure_shift_available()
        self._ensure_cycle_available(PICKUP_DURATION_HOURS)
        self._append_event(
            event_type='pickup',
            status='on_duty_not_driving',
            duration_hours=PICKUP_DURATION_HOURS,
            location=location,
            remark=f'Pickup at {location}',
            distance_miles=0.0,
            counts_toward_cycle=True,
            counts_as_driving=False,
            satisfies_break=True,
        )

    def _schedule_dropoff(self, location: str) -> None:
        self._ensure_shift_available()
        self._ensure_cycle_available(DROPOFF_DURATION_HOURS)
        self._append_event(
            event_type='dropoff',
            status='on_duty_not_driving',
            duration_hours=DROPOFF_DURATION_HOURS,
            location=location,
            remark=f'Dropoff at {location}',
            distance_miles=0.0,
            counts_toward_cycle=True,
            counts_as_driving=False,
            satisfies_break=True,
        )

    def _append_break(self) -> None:
        self._ensure_shift_available()
        self._ensure_cycle_available(BREAK_DURATION_HOURS)
        self._append_event(
            event_type='break',
            status='on_duty_not_driving',
            duration_hours=BREAK_DURATION_HOURS,
            location=self._current_location(),
            remark='30-minute break',
            distance_miles=0.0,
            counts_toward_cycle=True,
            counts_as_driving=False,
            satisfies_break=True,
        )

    def _append_fuel(self, location: str) -> None:
        self._ensure_shift_available()
        self._ensure_cycle_available(FUEL_DURATION_HOURS)
        self._append_event(
            event_type='fuel',
            status='on_duty_not_driving',
            duration_hours=FUEL_DURATION_HOURS,
            location=location,
            remark=f'Fuel stop at {location}',
            distance_miles=0.0,
            counts_toward_cycle=True,
            counts_as_driving=False,
            satisfies_break=True,
        )

    def _append_rest(self) -> None:
        self._append_event(
            event_type='rest',
            status='off_duty',
            duration_hours=DAILY_RESET_HOURS,
            location=self._current_location(),
            remark='10-hour off-duty rest',
            distance_miles=0.0,
            counts_toward_cycle=False,
            counts_as_driving=False,
            reset_shift=True,
        )

    def _append_restart(self) -> None:
        self._append_event(
            event_type='restart',
            status='off_duty',
            duration_hours=CYCLE_RESTART_HOURS,
            location=self._current_location(),
            remark='34-hour cycle restart',
            distance_miles=0.0,
            counts_toward_cycle=False,
            counts_as_driving=False,
            reset_shift=True,
            reset_cycle=True,
        )

    def _append_event(
        self,
        event_type: str,
        status: str,
        duration_hours: float,
        location: str,
        remark: str,
        distance_miles: float,
        counts_toward_cycle: bool,
        counts_as_driving: bool,
        satisfies_break: bool = False,
        reset_shift: bool = False,
        reset_cycle: bool = False,
    ) -> None:
        if duration_hours <= 0:
            raise ValueError('Event duration must be positive')

        start = self.cursor
        end = start + timedelta(hours=duration_hours)
        event = {
            'type': event_type,
            'status': status,
            'start_datetime': to_iso_string(start),
            'end_datetime': to_iso_string(end),
            'duration_hours': round_hours(duration_hours),
            'distance_miles': round_hours(distance_miles),
            'location': location,
            'remark': remark,
        }
        self.events.append(event)
        self.cursor = end

        if event_type in STOP_EVENT_TYPES:
            self.stops.append(dict(event))

        if counts_as_driving:
            self.shift_driving_hours = round_hours(self.shift_driving_hours + duration_hours)
            self.driving_since_break = round_hours(self.driving_since_break + duration_hours)
            self.total_driving_hours = round_hours(self.total_driving_hours + duration_hours)

        if counts_toward_cycle:
            self.shift_duty_window_hours = round_hours(
                self.shift_duty_window_hours + duration_hours
            )
            self.current_cycle_used_hours = round_hours(
                self.current_cycle_used_hours + duration_hours
            )
            self.total_on_duty_hours = round_hours(self.total_on_duty_hours + duration_hours)

        if counts_as_driving or event_type == 'driving':
            self.miles_since_fuel = round_hours(self.miles_since_fuel + distance_miles)
            self.total_miles = round_hours(self.total_miles + distance_miles)

        if satisfies_break:
            self.driving_since_break = 0.0

        if reset_shift:
            self.shift_driving_hours = 0.0
            self.shift_duty_window_hours = 0.0
            self.driving_since_break = 0.0

        if reset_cycle:
            self.current_cycle_used_hours = 0.0

        if event_type == 'fuel':
            self.miles_since_fuel = 0.0

    def _current_location(self) -> str:
        if self.events:
            return self.events[-1].get('location', '')
        return ''


def generate_hos_events(
    route_segments: list[dict],
    start_datetime,
    current_cycle_used_hours: float,
) -> dict[str, Any]:
    """
    Convert route segments into HOS-compliant duty events and stop summaries.

    Enforces 11-hour driving, 14-hour duty window, 30-minute breaks after 8 hours
    of driving, fuel every 1,000 miles, 10-hour daily rest, and 34-hour cycle
    restart when the 70-hour limit is reached. Returns events, stops, and summary.
    """
    scheduler = HOSScheduler(
        start_datetime=start_datetime,
        current_cycle_used_hours=current_cycle_used_hours,
    )
    return scheduler.process_segments(route_segments)
