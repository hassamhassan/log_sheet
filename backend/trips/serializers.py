from rest_framework import serializers

from .models import Trip
from .services.constants import CYCLE_LIMIT_HOURS


class TripPlanRequestSerializer(serializers.Serializer):
    INVALID_LOCATION_VALUES = {
        'string', 'test', 'location', 'null', 'undefined', 'none', 'n/a', 'na',
    }
    PLACEHOLDER_ERROR_MESSAGE = (
        'Please enter a real city/address, not a placeholder value.'
    )

    current_location = serializers.CharField(max_length=255, trim_whitespace=False)
    pickup_location = serializers.CharField(max_length=255, trim_whitespace=False)
    dropoff_location = serializers.CharField(max_length=255, trim_whitespace=False)
    current_cycle_used_hours = serializers.FloatField()
    start_datetime = serializers.DateTimeField()
    driver_name = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    carrier_name = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    main_office_address = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    vehicle_number = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    trailer_number = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    shipping_document = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")

    def validate_current_location(self, value):
        return self._validate_location_value(value)

    def validate_pickup_location(self, value):
        return self._validate_location_value(value)

    def validate_dropoff_location(self, value):
        return self._validate_location_value(value)

    def _validate_location_value(self, value):
        cleaned = (value or '').strip()
        if not cleaned:
            raise serializers.ValidationError('Location is required.')
        if cleaned.lower() in self.INVALID_LOCATION_VALUES:
            raise serializers.ValidationError(self.PLACEHOLDER_ERROR_MESSAGE)
        if len(cleaned) < 3:
            raise serializers.ValidationError(self.PLACEHOLDER_ERROR_MESSAGE)
        return cleaned

    def validate_current_cycle_used_hours(self, value):
        if value < 0 or value > CYCLE_LIMIT_HOURS:
            raise serializers.ValidationError(
                f'current_cycle_used_hours must be between 0 and {CYCLE_LIMIT_HOURS}.'
            )
        return value


class TripListSerializer(serializers.ModelSerializer):
    number_of_log_sheets = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            'id',
            'current_location',
            'pickup_location',
            'dropoff_location',
            'current_cycle_used_hours',
            'start_datetime',
            'driver_name',
            'carrier_name',
            'total_miles',
            'total_driving_hours',
            'total_on_duty_hours',
            'number_of_log_sheets',
            'created_at',
        ]

    def get_number_of_log_sheets(self, obj) -> int:
        return len(obj.daily_logs or [])


class TripDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = [
            'id',
            'current_location',
            'pickup_location',
            'dropoff_location',
            'current_cycle_used_hours',
            'start_datetime',
            'driver_name',
            'carrier_name',
            'main_office_address',
            'vehicle_number',
            'trailer_number',
            'shipping_document',
            'total_miles',
            'total_driving_hours',
            'total_on_duty_hours',
            'route_data',
            'stops_data',
            'daily_logs',
            'created_at',
            'updated_at',
        ]
