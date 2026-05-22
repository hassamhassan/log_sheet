from datetime import datetime

from django.test import TestCase

from trips.services.log_generator import generate_daily_logs


class DailyLogGeneratorTests(TestCase):
    def _driving_event(self, start, end, miles=0.0, remark='', location=''):
        return {
            'type': 'driving',
            'status': 'driving',
            'start_datetime': start,
            'end_datetime': end,
            'duration_hours': 8.0,
            'distance_miles': miles,
            'location': location,
            'remark': remark,
        }

    def test_single_event_within_day_totals_24(self):
        events = [
            self._driving_event(
                '2024-06-01T08:00:00',
                '2024-06-01T16:00:00',
                miles=120.0,
                remark='Driving from Dallas, TX',
                location='Dallas, TX',
            ),
        ]
        logs = generate_daily_logs(events, {'driver_name': 'Alex Driver'})

        self.assertEqual(len(logs), 1)
        log = logs[0]
        self.assertEqual(log['date'], '2024-06-01')
        self.assertEqual(log['totals']['total'], 24.0)
        self.assertEqual(log['totals']['driving'], 8.0)
        self.assertEqual(log['totals']['off_duty'], 16.0)
        self.assertEqual(sum(item['duration_hours'] for item in log['events']), 24.0)

    def test_event_crossing_midnight_splits_into_two_days(self):
        events = [
            self._driving_event(
                '2024-06-01T22:00:00',
                '2024-06-02T06:00:00',
                miles=400.0,
            ),
        ]
        logs = generate_daily_logs(events)

        self.assertEqual(len(logs), 2)
        self.assertEqual(logs[0]['date'], '2024-06-01')
        self.assertEqual(logs[1]['date'], '2024-06-02')
        self.assertEqual(logs[0]['totals']['total'], 24.0)
        self.assertEqual(logs[1]['totals']['total'], 24.0)
        self.assertEqual(logs[0]['totals']['driving'], 2.0)
        self.assertEqual(logs[1]['totals']['driving'], 6.0)

    def test_driving_miles_only_from_driving_events(self):
        events = [
            self._driving_event(
                '2024-06-01T08:00:00',
                '2024-06-01T12:00:00',
                miles=200.0,
            ),
            {
                'type': 'pickup',
                'status': 'on_duty_not_driving',
                'start_datetime': '2024-06-01T12:00:00',
                'end_datetime': '2024-06-01T14:00:00',
                'duration_hours': 2.0,
                'distance_miles': 999.0,
                'location': 'Warehouse',
                'remark': 'Pickup',
            },
        ]
        logs = generate_daily_logs(events)

        self.assertEqual(logs[0]['total_miles'], 200.0)

    def test_gaps_filled_as_off_duty(self):
        events = [
            self._driving_event(
                '2024-06-01T10:00:00',
                '2024-06-01T12:00:00',
            ),
        ]
        logs = generate_daily_logs(events)
        log = logs[0]

        gap_events = [e for e in log['events'] if e['status'] == 'off_duty']
        self.assertTrue(len(gap_events) >= 2)
        self.assertEqual(log['totals']['off_duty'], 22.0)
        self.assertTrue(any(e['start_time'] == '00:00' for e in gap_events))
        self.assertTrue(any(e['end_time'] == '24:00' for e in gap_events))

    def test_remarks_preserved_for_duty_changes(self):
        events = [
            self._driving_event(
                '2024-06-01T08:00:00',
                '2024-06-01T16:00:00',
                remark='Driving from Dallas, TX',
            ),
        ]
        logs = generate_daily_logs(events)

        self.assertIn('08:00 - Driving from Dallas, TX', logs[0]['remarks'])

    def test_form_metadata_attached(self):
        metadata = {
            'driver_name': 'Alex',
            'carrier_name': 'Carrier Co',
            'main_office_address': '123 Main St',
            'vehicle_number': 'TRK-1',
            'trailer_number': 'TRL-9',
            'shipping_document': 'BOL-22',
        }
        events = [
            self._driving_event('2024-06-01T08:00:00', '2024-06-01T16:00:00'),
        ]
        logs = generate_daily_logs(events, metadata)

        self.assertEqual(logs[0]['form'], metadata)
