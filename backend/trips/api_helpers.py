"""Shared API response helpers for trip views."""

from rest_framework import status
from rest_framework.response import Response

from .services.constants import API_HEALTH_MESSAGE, API_HEALTH_STATUS


def error_response(message, details=None, status_code=status.HTTP_400_BAD_REQUEST):
    """Return a stable JSON error payload for API consumers."""
    return Response(
        {'error': message, 'details': details or {}},
        status=status_code,
    )


def health_payload():
    """Return the standard health-check response body."""
    return {
        'status': API_HEALTH_STATUS,
        'message': API_HEALTH_MESSAGE,
    }
