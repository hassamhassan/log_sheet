from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .api_helpers import error_response, health_payload
from .models import Trip
from .serializers import TripDetailSerializer, TripListSerializer, TripPlanRequestSerializer
from .services.exceptions import GeocodingError, RoutePlanningError, ServiceError
from .services.trip_planner import build_trip_response, create_trip_plan

TRIP_PLAN_EXAMPLE = OpenApiExample(
    'Real trip example',
    value={
        'current_location': 'Dallas, TX',
        'pickup_location': 'Houston, TX',
        'dropoff_location': 'Atlanta, GA',
        'current_cycle_used_hours': 20,
        'start_datetime': '2026-05-21T08:00:00Z',
        'driver_name': 'John Driver',
        'carrier_name': 'Demo Carrier',
        'main_office_address': 'Dallas, TX',
        'vehicle_number': 'TRK-100',
        'trailer_number': 'TRL-900',
        'shipping_document': 'BOL-12345',
    },
    request_only=True,
)


class HealthCheckView(APIView):
    @extend_schema(
        summary='Health check',
        description='Returns API status.',
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string'},
                    'message': {'type': 'string'},
                },
            }
        },
    )
    def get(self, request):
        return Response(health_payload())


class TripListView(generics.ListAPIView):
    queryset = Trip.objects.all()
    serializer_class = TripListSerializer

    @extend_schema(summary='List trips', responses=TripListSerializer(many=True))
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class TripDetailView(generics.RetrieveAPIView):
    queryset = Trip.objects.all()
    serializer_class = TripDetailSerializer

    @extend_schema(summary='Retrieve trip with route, stops, and daily logs', responses={200: dict})
    def get(self, request, *args, **kwargs):
        trip = self.get_object()
        return Response(build_trip_response(trip))


class TripPlanView(APIView):
    @extend_schema(
        summary='Plan a trip',
        request=TripPlanRequestSerializer,
        responses={201: dict},
        examples=[TRIP_PLAN_EXAMPLE],
    )
    def post(self, request):
        serializer = TripPlanRequestSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data

        try:
            result = create_trip_plan(validated_data)
        except GeocodingError as exc:
            return error_response(str(exc))
        except RoutePlanningError as exc:
            return error_response(str(exc))
        except ServiceError as exc:
            return error_response(str(exc))
        except Exception:
            return error_response(
                'An unexpected error occurred while planning the trip.',
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(result, status=status.HTTP_201_CREATED)
