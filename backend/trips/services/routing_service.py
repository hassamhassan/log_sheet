"""Routing service using OSRM with haversine fallback."""

from __future__ import annotations

from typing import Any
from urllib.parse import urlencode

import requests
from requests.exceptions import RequestException

from .constants import (
    DEFAULT_AVERAGE_SPEED_MPH,
    MAX_ROUTE_GEOMETRY_POINTS,
    MAX_SEGMENT_GEOMETRY_POINTS,
    METERS_PER_MILE,
    OSRM_BASE_URL,
    OSRM_TIMEOUT_SECONDS,
    SECONDS_PER_HOUR,
)
from .distance_utils import estimate_duration_hours, haversine_miles
from .exceptions import GeocodingError, RoutePlanningError
from .geocoding_service import geocode_location
from .time_utils import round_hours


def simplify_geometry(points: list, max_points: int = 500) -> list:
    """
    Downsample route geometry for frontend map rendering.
    Always keep the first and last point.
    """
    if not points or len(points) <= max_points:
        return points

    step = max(1, len(points) // max_points)
    simplified = points[::step]

    if simplified[0] != points[0]:
        simplified.insert(0, points[0])

    if simplified[-1] != points[-1]:
        simplified.append(points[-1])

    if len(simplified) > max_points:
        step = max(1, (len(simplified) - 1) // (max_points - 1))
        simplified = [simplified[i * step] for i in range(max_points - 1)]
        simplified.append(points[-1])

    return simplified


def build_route(
    current_location: str,
    pickup_location: str,
    dropoff_location: str,
    timeout: int = OSRM_TIMEOUT_SECONDS,
) -> dict[str, Any]:
    """
    Plan a two-leg driving route: current → pickup → dropoff.

    Geocodes all locations, requests OSRM road geometry per leg, and falls back
    to haversine distance at 55 mph when OSRM is unavailable. Returns a stable
    dict with geometry, segments, totals, and an estimated flag.
    """
    locations = {
        'current': _resolve_location(current_location),
        'pickup': _resolve_location(pickup_location),
        'dropoff': _resolve_location(dropoff_location),
    }

    leg_definitions = [
        {
            'type': 'current_to_pickup',
            'from_key': 'current',
            'to_key': 'pickup',
        },
        {
            'type': 'pickup_to_dropoff',
            'from_key': 'pickup',
            'to_key': 'dropoff',
        },
    ]

    segments: list[dict[str, Any]] = []
    combined_geometry: list[list[float]] = []
    estimated = False
    total_miles = 0.0
    total_duration_hours = 0.0

    for definition in leg_definitions:
        origin = locations[definition['from_key']]
        destination = locations[definition['to_key']]

        try:
            leg = _fetch_osrm_leg(origin, destination, timeout=timeout)
        except RoutePlanningError:
            leg = _build_haversine_leg(origin, destination)
            estimated = True

        segment_geometry = simplify_geometry(
            leg['geometry'],
            max_points=MAX_SEGMENT_GEOMETRY_POINTS,
        )
        segment = {
            'type': definition['type'],
            'from_location': origin['display_name'],
            'to_location': destination['display_name'],
            'distance_miles': leg['distance_miles'],
            'duration_hours': leg['duration_hours'],
            'geometry': segment_geometry,
        }
        segments.append(segment)
        total_miles = round_hours(total_miles + leg['distance_miles'])
        total_duration_hours = round_hours(total_duration_hours + leg['duration_hours'])
        combined_geometry = _merge_geometry(combined_geometry, segment_geometry)

    return {
        'total_miles': round_hours(total_miles),
        'total_duration_hours': round_hours(total_duration_hours),
        'geometry': simplify_geometry(
            combined_geometry,
            max_points=MAX_ROUTE_GEOMETRY_POINTS,
        ),
        'segments': segments,
        'estimated': estimated,
    }


def _resolve_location(location: str) -> dict[str, Any]:
    """Geocode a location or re-raise as a route planning error."""
    try:
        return geocode_location(location)
    except GeocodingError as exc:
        raise RoutePlanningError(str(exc)) from exc


def _fetch_osrm_leg(
    origin: dict[str, Any],
    destination: dict[str, Any],
    timeout: int,
) -> dict[str, Any]:
    """Fetch a single route leg from the OSRM demo server."""
    coordinates = f"{origin['lng']},{origin['lat']};{destination['lng']},{destination['lat']}"
    params = {
        'overview': 'simplified',
        'geometries': 'geojson',
        'steps': 'false',
    }
    url = f'{OSRM_BASE_URL}/{coordinates}?{urlencode(params)}'

    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        payload = response.json()
    except (RequestException, ValueError) as exc:
        raise RoutePlanningError('Routing service request failed.') from exc

    if payload.get('code') != 'Ok':
        message = payload.get('message', 'Routing service returned no route.')
        raise RoutePlanningError(message)

    try:
        route = payload['routes'][0]
        distance_miles = round_hours(float(route['distance']) / METERS_PER_MILE)
        duration_hours = round_hours(float(route['duration']) / SECONDS_PER_HOUR)
        geometry = _geojson_to_lat_lng(route['geometry']['coordinates'])
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise RoutePlanningError('Routing service returned an invalid route.') from exc

    if not geometry:
        raise RoutePlanningError('Routing service returned empty geometry.')

    return {
        'distance_miles': distance_miles,
        'duration_hours': duration_hours,
        'geometry': geometry,
    }


def _build_haversine_leg(
    origin: dict[str, Any],
    destination: dict[str, Any],
) -> dict[str, Any]:
    """Estimate a route leg using haversine distance and average speed."""
    distance_miles = haversine_miles(
        origin['lat'],
        origin['lng'],
        destination['lat'],
        destination['lng'],
    )
    duration_hours = estimate_duration_hours(
        distance_miles,
        average_speed_mph=DEFAULT_AVERAGE_SPEED_MPH,
    )
    geometry = [
        [origin['lat'], origin['lng']],
        [destination['lat'], destination['lng']],
    ]
    return {
        'distance_miles': distance_miles,
        'duration_hours': duration_hours,
        'geometry': geometry,
    }


def _geojson_to_lat_lng(coordinates: list[list[float]]) -> list[list[float]]:
    """Convert GeoJSON [lng, lat] coordinates to [lat, lng] pairs."""
    return [[point[1], point[0]] for point in coordinates]


def _merge_geometry(
    existing: list[list[float]],
    new_points: list[list[float]],
) -> list[list[float]]:
    """Append route geometry, skipping duplicate join points."""
    if not existing:
        return list(new_points)
    if not new_points:
        return existing

    merged = list(existing)
    start_index = 0
    if _points_equal(merged[-1], new_points[0]):
        start_index = 1
    merged.extend(new_points[start_index:])
    return merged


def _points_equal(first: list[float], second: list[float]) -> bool:
    return (
        round(first[0], 5) == round(second[0], 5)
        and round(first[1], 5) == round(second[1], 5)
    )
