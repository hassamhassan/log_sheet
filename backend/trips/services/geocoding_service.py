"""Geocoding service using the public Nominatim API."""

from __future__ import annotations

from typing import Any
from urllib.parse import urlencode

import requests
from requests.exceptions import RequestException

from .constants import (
    NOMINATIM_ACCEPT_LANGUAGE,
    NOMINATIM_BASE_URL,
    NOMINATIM_TIMEOUT_SECONDS,
    NOMINATIM_USER_AGENT,
)
from .exceptions import GeocodingError


def geocode_location(
    location: str,
    timeout: int = NOMINATIM_TIMEOUT_SECONDS,
) -> dict[str, Any]:
    """
    Resolve a free-text location to coordinates using Nominatim.

    Returns a normalized dict with lat, lng, and display_name. Raises
    GeocodingError on empty input, network failure, or no match.
    """
    query = (location or '').strip()
    if not query:
        raise GeocodingError('Location cannot be empty.')

    params = {
        'q': query,
        'format': 'json',
        'limit': 1,
        'accept-language': NOMINATIM_ACCEPT_LANGUAGE,
    }
    headers = {
        'User-Agent': NOMINATIM_USER_AGENT,
        'Accept-Language': NOMINATIM_ACCEPT_LANGUAGE,
    }

    try:
        response = requests.get(
            NOMINATIM_BASE_URL,
            params=params,
            headers=headers,
            timeout=timeout,
        )
        response.raise_for_status()
        results = response.json()
    except RequestException as exc:
        raise GeocodingError(f'Geocoding request failed for "{query}".') from exc
    except ValueError as exc:
        raise GeocodingError(f'Invalid geocoding response for "{query}".') from exc

    if not results:
        raise GeocodingError(f'Could not resolve location: "{query}".')

    try:
        first = results[0]
        lat = float(first['lat'])
        lng = float(first['lon'])
        display_name = str(first.get('display_name', query))
    except (KeyError, TypeError, ValueError) as exc:
        raise GeocodingError(f'Invalid geocoding result for "{query}".') from exc

    return {
        'lat': lat,
        'lng': lng,
        'display_name': display_name,
    }
