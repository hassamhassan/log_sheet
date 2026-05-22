from django.test import TestCase

from trips.serializers import TripPlanRequestSerializer
from trips.services.constants import CYCLE_LIMIT_HOURS

PLACEHOLDER_MESSAGE = 'Please enter a real city/address, not a placeholder value.'


class TripPlanRequestSerializerTests(TestCase):
    def _valid_data(self, **overrides):
        data = {
            'current_location': 'Dallas, TX',
            'pickup_location': 'Houston, TX',
            'dropoff_location': 'Atlanta, GA',
            'current_cycle_used_hours': 20,
            'start_datetime': '2026-05-21T08:00:00Z',
        }
        data.update(overrides)
        return data

    def test_valid_payload_passes(self):
        serializer = TripPlanRequestSerializer(data=self._valid_data())
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_accepts_real_city_addresses(self):
        serializer = TripPlanRequestSerializer(data=self._valid_data())
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['current_location'], 'Dallas, TX')
        self.assertEqual(serializer.validated_data['pickup_location'], 'Houston, TX')
        self.assertEqual(serializer.validated_data['dropoff_location'], 'Atlanta, GA')

    def test_rejects_string_placeholder_for_all_locations(self):
        serializer = TripPlanRequestSerializer(data={
            'current_location': 'string',
            'pickup_location': 'string',
            'dropoff_location': 'string',
            'current_cycle_used_hours': 20,
            'start_datetime': '2026-05-21T08:00:00Z',
        })
        self.assertFalse(serializer.is_valid())
        for field in ('current_location', 'pickup_location', 'dropoff_location'):
            self.assertIn(field, serializer.errors)
            self.assertEqual(serializer.errors[field][0], PLACEHOLDER_MESSAGE)

    def test_rejects_placeholder_case_insensitive(self):
        serializer = TripPlanRequestSerializer(
            data=self._valid_data(current_location='STRING')
        )
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors['current_location'][0], PLACEHOLDER_MESSAGE)

    def test_rejects_empty_location_values(self):
        serializer = TripPlanRequestSerializer(
            data=self._valid_data(current_location='   ')
        )
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors['current_location'][0], 'Location is required.')

    def test_rejects_short_location_values(self):
        serializer = TripPlanRequestSerializer(
            data=self._valid_data(pickup_location='ab')
        )
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors['pickup_location'][0], PLACEHOLDER_MESSAGE)

    def test_rejects_other_placeholder_values(self):
        for placeholder in ('test', 'null', 'undefined', 'n/a'):
            with self.subTest(placeholder=placeholder):
                serializer = TripPlanRequestSerializer(
                    data=self._valid_data(dropoff_location=placeholder)
                )
                self.assertFalse(serializer.is_valid())
                self.assertEqual(
                    serializer.errors['dropoff_location'][0],
                    PLACEHOLDER_MESSAGE,
                )

    def test_cycle_over_limit_fails(self):
        serializer = TripPlanRequestSerializer(
            data=self._valid_data(current_cycle_used_hours=CYCLE_LIMIT_HOURS + 1)
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('current_cycle_used_hours', serializer.errors)

    def test_negative_cycle_fails(self):
        serializer = TripPlanRequestSerializer(
            data=self._valid_data(current_cycle_used_hours=-1)
        )
        self.assertFalse(serializer.is_valid())

    def test_missing_start_datetime_fails(self):
        data = self._valid_data()
        del data['start_datetime']
        serializer = TripPlanRequestSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('start_datetime', serializer.errors)
