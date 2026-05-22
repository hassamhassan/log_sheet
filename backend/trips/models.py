from django.db import models


class Trip(models.Model):
    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    current_cycle_used_hours = models.FloatField()
    start_datetime = models.DateTimeField()
    driver_name = models.CharField(max_length=255, blank=True, default="")
    carrier_name = models.CharField(max_length=255, blank=True, default="")
    main_office_address = models.CharField(max_length=255, blank=True, default="")
    vehicle_number = models.CharField(max_length=100, blank=True, default="")
    trailer_number = models.CharField(max_length=100, blank=True, default="")
    shipping_document = models.CharField(max_length=100, blank=True, default="")
    total_miles = models.FloatField(default=0)
    total_driving_hours = models.FloatField(default=0)
    total_on_duty_hours = models.FloatField(default=0)
    route_data = models.JSONField(default=dict, blank=True)
    stops_data = models.JSONField(default=list, blank=True)
    daily_logs = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return (
            f"Trip {self.pk}: {self.current_location} → "
            f"{self.pickup_location} → {self.dropoff_location}"
        )
