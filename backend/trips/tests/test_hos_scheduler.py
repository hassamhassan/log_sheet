from django.test import TestCase

from trips.services.constants import (
    BREAK_AFTER_DRIVING_HOURS,
    CYCLE_LIMIT_HOURS,
    CYCLE_RESTART_HOURS,
    DAILY_RESET_HOURS,
    FUEL_INTERVAL_MILES,
    MAX_DRIVING_HOURS,
)
from trips.services.hos_scheduler import generate_hos_events


REQUIRED_STOP_FIELDS = {
    'type', 'status', 'start_datetime', 'end_datetime',
    'duration_hours', 'distance_miles', 'location', 'remark',
}
ALLOWED_STOP_TYPES = {'pickup', 'dropoff', 'fuel', 'break', 'rest', 'restart'}


class HOSSchedulerTests(TestCase):
    def _run(self, segments, start='2024-06-01T08:00:00', cycle_used=0.0):
        return generate_hos_events(segments, start, cycle_used)

    def _event_types(self, result):
        return [event['type'] for event in result['events']]

    def _assert_stop_shape(self, stops):
        self.assertTrue(stops)
        for stop in stops:
            self.assertEqual(REQUIRED_STOP_FIELDS, set(stop.keys()))
            self.assertIn(stop['type'], ALLOWED_STOP_TYPES)
            self.assertNotEqual(stop['type'], 'driving')
            self.assertIsNotNone(stop['status'])
            self.assertIsNotNone(stop['duration_hours'])
            self.assertGreater(stop['duration_hours'], 0)
            self.assertIsNotNone(stop['start_datetime'])
            self.assertIsNotNone(stop['end_datetime'])
            self.assertIsNotNone(stop['remark'])
            self.assertIsInstance(stop['location'], str)

    def test_short_trip_produces_pickup_and_dropoff(self):
        result = self._run([
            {
                'type': 'current_to_pickup',
                'from_location': 'Dallas, TX',
                'to_location': 'Houston, TX',
                'distance_miles': 50,
                'duration_hours': 1.0,
            },
            {
                'type': 'pickup_to_dropoff',
                'from_location': 'Houston, TX',
                'to_location': 'Atlanta, GA',
                'distance_miles': 50,
                'duration_hours': 1.0,
            },
        ])

        types = self._event_types(result)
        self.assertIn('pickup', types)
        self.assertIn('dropoff', types)

    def test_long_trip_produces_10_hour_rest(self):
        result = self._run([
            {
                'type': 'pickup_to_dropoff',
                'from_location': 'Origin, TX',
                'to_location': 'Far City, GA',
                'distance_miles': 900,
                'duration_hours': 16.0,
            },
        ])

        rest_events = [
            event for event in result['events']
            if event['type'] == 'rest'
        ]
        self.assertTrue(rest_events)
        self.assertEqual(rest_events[0]['duration_hours'], DAILY_RESET_HOURS)

    def test_trip_over_1000_miles_produces_fuel_stop(self):
        result = self._run([
            {
                'type': 'pickup_to_dropoff',
                'from_location': 'Dallas, TX',
                'to_location': 'Los Angeles, CA',
                'distance_miles': 1400,
                'duration_hours': 25.0,
            },
        ])

        self.assertIn('fuel', self._event_types(result))

    def test_more_than_8_driving_hours_produces_break(self):
        result = self._run([
            {
                'type': 'pickup_to_dropoff',
                'from_location': 'Dallas, TX',
                'to_location': 'Memphis, TN',
                'distance_miles': 500,
                'duration_hours': 9.5,
            },
        ])

        driving_hours = sum(
            event['duration_hours']
            for event in result['events']
            if event['type'] == 'driving'
        )
        self.assertGreater(driving_hours, BREAK_AFTER_DRIVING_HOURS)
        self.assertIn('break', self._event_types(result))

    def test_cycle_used_near_70_produces_34_hour_restart(self):
        result = self._run(
            [
                {
                    'type': 'pickup_to_dropoff',
                    'from_location': 'Dallas, TX',
                    'to_location': 'Houston, TX',
                    'distance_miles': 239,
                    'duration_hours': 4.5,
                },
            ],
            cycle_used=69.0,
        )

        restart_events = [
            event for event in result['events']
            if event['type'] == 'restart'
        ]
        self.assertTrue(restart_events)
        self.assertEqual(restart_events[0]['duration_hours'], CYCLE_RESTART_HOURS)
        self.assertLessEqual(
            result['summary']['current_cycle_used_hours'],
            CYCLE_LIMIT_HOURS,
        )

    def test_no_event_has_negative_duration(self):
        result = self._run([
            {
                'type': 'current_to_pickup',
                'from_location': 'A',
                'to_location': 'B',
                'distance_miles': 1200,
                'duration_hours': 22.0,
            },
            {
                'type': 'pickup_to_dropoff',
                'from_location': 'B',
                'to_location': 'C',
                'distance_miles': 300,
                'duration_hours': 6.0,
            },
        ])

        for event in result['events']:
            self.assertGreater(event['duration_hours'], 0)

    def test_driving_chunks_do_not_exceed_11_hour_shift_limit(self):
        result = self._run([
            {
                'type': 'pickup_to_dropoff',
                'from_location': 'Dallas, TX',
                'to_location': 'Chicago, IL',
                'distance_miles': 920,
                'duration_hours': 16.5,
            },
        ])

        driving_between_resets = []
        current = 0.0
        for event in result['events']:
            if event['type'] == 'rest':
                driving_between_resets.append(current)
                current = 0.0
            elif event['type'] == 'driving':
                current += event['duration_hours']
        if current:
            driving_between_resets.append(current)

        for block in driving_between_resets:
            self.assertLessEqual(block, MAX_DRIVING_HOURS + 0.01)

    def test_stops_have_consistent_frontend_shape(self):
        result = self._run([
            {
                'type': 'current_to_pickup',
                'from_location': 'Dallas, TX',
                'to_location': 'Houston, TX',
                'distance_miles': 239,
                'duration_hours': 4.2,
            },
            {
                'type': 'pickup_to_dropoff',
                'from_location': 'Houston, TX',
                'to_location': 'Atlanta, GA',
                'distance_miles': 793,
                'duration_hours': 12.7,
            },
        ])

        self._assert_stop_shape(result['stops'])
        stop_types = {stop['type'] for stop in result['stops']}
        self.assertIn('pickup', stop_types)
        self.assertIn('dropoff', stop_types)

    def test_cycle_heavy_trip_stops_include_restart_with_full_fields(self):
        result = self._run(
            [
                {
                    'type': 'pickup_to_dropoff',
                    'from_location': 'Dallas, TX',
                    'to_location': 'Houston, TX',
                    'distance_miles': 239,
                    'duration_hours': 4.5,
                },
            ],
            cycle_used=69.0,
        )

        self._assert_stop_shape(result['stops'])
        restart_stops = [s for s in result['stops'] if s['type'] == 'restart']
        self.assertTrue(restart_stops)
        self.assertEqual(restart_stops[0]['status'], 'off_duty')
        self.assertEqual(restart_stops[0]['duration_hours'], CYCLE_RESTART_HOURS)

    def test_stops_exclude_driving_events(self):
        result = self._run([
            {
                'type': 'pickup_to_dropoff',
                'from_location': 'Dallas, TX',
                'to_location': 'Memphis, TN',
                'distance_miles': 500,
                'duration_hours': 9.5,
            },
        ])

        self.assertTrue(all(stop['type'] != 'driving' for stop in result['stops']))

    def test_summary_totals_populated(self):
        result = self._run([
            {
                'type': 'current_to_pickup',
                'from_location': 'Dallas, TX',
                'to_location': 'Houston, TX',
                'distance_miles': 239,
                'duration_hours': 4.2,
            },
        ])

        summary = result['summary']
        self.assertEqual(summary['total_miles'], 239.0)
        self.assertGreater(summary['total_driving_hours'], 0)
        self.assertTrue(summary['estimated'])
