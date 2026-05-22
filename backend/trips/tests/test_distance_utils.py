from django.test import TestCase

from trips.services.distance_utils import (
    estimate_duration_hours,
    haversine_miles,
    km_to_miles,
    miles_to_km,
)


class DistanceUtilsTests(TestCase):
    def test_haversine_known_distance(self):
        # Dallas, TX to Houston, TX ~224 miles
        miles = haversine_miles(32.7767, -96.7970, 29.7604, -95.3698)
        self.assertGreater(miles, 200)
        self.assertLess(miles, 250)

    def test_unit_conversions(self):
        self.assertEqual(miles_to_km(10), 16.09)
        self.assertEqual(km_to_miles(16.09), 10.0)

    def test_estimate_duration_hours(self):
        hours = estimate_duration_hours(110, average_speed_mph=55)
        self.assertEqual(hours, 2.0)
