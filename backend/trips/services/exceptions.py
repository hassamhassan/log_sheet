"""Service-layer exceptions for trip planning."""


class ServiceError(Exception):
    """Base exception for trip planning services."""


class GeocodingError(ServiceError):
    """Raised when a location cannot be geocoded."""


class RoutePlanningError(ServiceError):
    """Raised when a route cannot be planned."""
