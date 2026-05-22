from django.contrib import admin

from .models import Trip


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'current_location',
        'pickup_location',
        'dropoff_location',
        'total_miles',
        'created_at',
    ]
    search_fields = [
        'current_location',
        'pickup_location',
        'dropoff_location',
        'driver_name',
        'carrier_name',
    ]
    readonly_fields = ['created_at', 'updated_at']
