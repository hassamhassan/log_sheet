"""Shared constants for ELD trip planning services."""

# API
API_HEALTH_STATUS = 'ok'
API_HEALTH_MESSAGE = 'ELD Trip Planner API running'

# HOS limits (simplified FMCSA-style rules)
MAX_DRIVING_HOURS = 11
MAX_DUTY_WINDOW_HOURS = 14
BREAK_AFTER_DRIVING_HOURS = 8
BREAK_DURATION_HOURS = 0.5
DAILY_RESET_HOURS = 10
CYCLE_LIMIT_HOURS = 70
CYCLE_RESTART_HOURS = 34
PICKUP_DURATION_HOURS = 1
DROPOFF_DURATION_HOURS = 1
FUEL_INTERVAL_MILES = 1000
FUEL_DURATION_HOURS = 0.5

# Travel estimation
DEFAULT_AVERAGE_SPEED_MPH = 55

# Scheduling precision
HOURS_EPSILON = 0.001
HOURS_PER_DAY = 24

# Geocoding / routing
NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search'
NOMINATIM_TIMEOUT_SECONDS = 10
NOMINATIM_USER_AGENT = 'ELDTripPlanner/1.0 (eld-trip-planner@local.dev)'
# Prefer English place names in display_name (Nominatim accept-language)
NOMINATIM_ACCEPT_LANGUAGE = 'en'
OSRM_BASE_URL = 'http://router.project-osrm.org/route/v1/driving'
OSRM_TIMEOUT_SECONDS = 15
METERS_PER_MILE = 1609.344
SECONDS_PER_HOUR = 3600

# Route geometry limits for API responses
MAX_ROUTE_GEOMETRY_POINTS = 500
MAX_SEGMENT_GEOMETRY_POINTS = 250
