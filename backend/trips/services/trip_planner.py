"""Orchestrates route planning, HOS scheduling, and daily log generation."""

from __future__ import annotations

from typing import Any

from ..models import Trip
from .constants import CYCLE_LIMIT_HOURS
from .time_utils import round_hours
from .hos_scheduler import generate_hos_events
from .log_generator import generate_daily_logs
from .routing_service import build_route


def create_trip_plan(validated_data: dict[str, Any]) -> dict[str, Any]:
    """
    Build a full trip plan, persist it, and return the API response payload.
    """
    route = build_route(
        validated_data['current_location'],
        validated_data['pickup_location'],
        validated_data['dropoff_location'],
    )

    hos_result = generate_hos_events(
        route_segments=route['segments'],
        start_datetime=validated_data['start_datetime'],
        current_cycle_used_hours=validated_data['current_cycle_used_hours'],
    )

    trip_metadata = {
        'driver_name': validated_data.get('driver_name', ''),
        'carrier_name': validated_data.get('carrier_name', ''),
        'main_office_address': validated_data.get('main_office_address', ''),
        'vehicle_number': validated_data.get('vehicle_number', ''),
        'trailer_number': validated_data.get('trailer_number', ''),
        'shipping_document': validated_data.get('shipping_document', ''),
    }

    daily_logs = generate_daily_logs(hos_result['events'], trip_metadata)
    hos_summary = hos_result['summary']
    initial_cycle_used_hours = round_hours(validated_data['current_cycle_used_hours'])
    trip_on_duty_hours = round_hours(hos_summary['total_on_duty_hours'])
    final_cycle_used_hours = round_hours(hos_summary['current_cycle_used_hours'])

    route_data = {
        'geometry': route['geometry'],
        'segments': route['segments'],
        'estimated': route['estimated'],
        'cycle_summary': {
            'initial_cycle_used_hours': initial_cycle_used_hours,
            'trip_on_duty_hours': trip_on_duty_hours,
            'final_cycle_used_hours': final_cycle_used_hours,
        },
    }

    trip = Trip.objects.create(
        current_location=validated_data['current_location'],
        pickup_location=validated_data['pickup_location'],
        dropoff_location=validated_data['dropoff_location'],
        current_cycle_used_hours=initial_cycle_used_hours,
        start_datetime=validated_data['start_datetime'],
        driver_name=trip_metadata['driver_name'],
        carrier_name=trip_metadata['carrier_name'],
        main_office_address=trip_metadata['main_office_address'],
        vehicle_number=trip_metadata['vehicle_number'],
        trailer_number=trip_metadata['trailer_number'],
        shipping_document=trip_metadata['shipping_document'],
        total_miles=hos_summary['total_miles'],
        total_driving_hours=hos_summary['total_driving_hours'],
        total_on_duty_hours=hos_summary['total_on_duty_hours'],
        route_data=route_data,
        stops_data=hos_result['stops'],
        daily_logs=daily_logs,
    )

    return build_trip_response(trip)


def _build_cycle_summary(trip: Trip) -> dict[str, float]:
    """Build cycle hour fields for API summary (supports legacy trips)."""
    route_data = trip.route_data or {}
    stored = route_data.get('cycle_summary', {})

    if stored:
        initial = round_hours(stored['initial_cycle_used_hours'])
        trip_on_duty = round_hours(stored['trip_on_duty_hours'])
        final = round_hours(stored['final_cycle_used_hours'])
    else:
        # Legacy trips stored final value in current_cycle_used_hours.
        final = round_hours(trip.current_cycle_used_hours)
        trip_on_duty = round_hours(trip.total_on_duty_hours)
        initial = round_hours(max(0.0, final - trip_on_duty))

    return {
        'initial_cycle_used_hours': initial,
        'trip_on_duty_hours': trip_on_duty,
        'final_cycle_used_hours': final,
        'remaining_cycle_hours': round_hours(max(0.0, CYCLE_LIMIT_HOURS - final)),
        'current_cycle_used_hours': initial,
    }


def build_trip_response(trip: Trip) -> dict[str, Any]:
    """Build a stable API response from a saved Trip instance."""
    route_data = trip.route_data or {}
    estimated = bool(route_data.get('estimated', False))
    cycle_summary = _build_cycle_summary(trip)

    return {
        'trip_id': trip.id,
        'summary': {
            'total_miles': trip.total_miles,
            'total_driving_hours': trip.total_driving_hours,
            'total_on_duty_hours': trip.total_on_duty_hours,
            **cycle_summary,
            'number_of_log_sheets': len(trip.daily_logs or []),
            'estimated': estimated,
        },
        'route': {
            'geometry': route_data.get('geometry', []),
            'segments': route_data.get('segments', []),
        },
        'stops': trip.stops_data or [],
        'daily_logs': trip.daily_logs or [],
    }
