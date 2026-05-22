"""Distance and travel-time estimation helpers."""

from __future__ import annotations

import math

from .constants import DEFAULT_AVERAGE_SPEED_MPH

EARTH_RADIUS_MILES = 3958.8
KM_PER_MILE = 1.60934


def haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance in miles between two lat/lon points."""
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(EARTH_RADIUS_MILES * c, 2)


def miles_to_km(miles: float) -> float:
    """Convert miles to kilometers."""
    return round(float(miles) * KM_PER_MILE, 2)


def km_to_miles(km: float) -> float:
    """Convert kilometers to miles."""
    return round(float(km) / KM_PER_MILE, 2)


def estimate_duration_hours(
    miles: float,
    average_speed_mph: float = DEFAULT_AVERAGE_SPEED_MPH,
) -> float:
    """Estimate travel duration in hours from distance at a given average speed."""
    if average_speed_mph <= 0:
        raise ValueError('average_speed_mph must be greater than zero')
    return round(float(miles) / float(average_speed_mph), 2)
