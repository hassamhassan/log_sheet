from datetime import datetime

from django.test import TestCase

from trips.services.time_utils import (
    duration_hours_between,
    format_hh_mm,
    minutes_from_midnight,
    parse_datetime,
    round_hours,
    split_at_midnight,
    to_iso_string,
)


class TimeUtilsTests(TestCase):
    def test_parse_datetime_iso_string(self):
        dt = parse_datetime('2024-06-01T08:30:00')
        self.assertEqual(dt, datetime(2024, 6, 1, 8, 30))

    def test_parse_datetime_z_suffix(self):
        dt = parse_datetime('2024-06-01T08:00:00Z')
        self.assertEqual(dt.hour, 8)

    def test_to_iso_string(self):
        self.assertEqual(
            to_iso_string(datetime(2024, 6, 1, 8, 0)),
            '2024-06-01T08:00:00',
        )

    def test_duration_hours_between(self):
        hours = duration_hours_between(
            '2024-06-01T08:00:00',
            '2024-06-01T16:00:00',
        )
        self.assertEqual(hours, 8.0)

    def test_minutes_from_midnight_and_format(self):
        self.assertEqual(minutes_from_midnight('2024-06-01T08:15:00'), 495)
        self.assertEqual(format_hh_mm(495), '08:15')
        self.assertEqual(format_hh_mm(1440), '24:00')

    def test_split_at_midnight(self):
        segments = split_at_midnight(
            '2024-06-01T22:00:00',
            '2024-06-02T06:00:00',
        )
        self.assertEqual(len(segments), 2)
        self.assertEqual(segments[0]['date'].isoformat(), '2024-06-01')
        self.assertEqual(segments[1]['date'].isoformat(), '2024-06-02')

    def test_round_hours(self):
        self.assertEqual(round_hours(8.0049), 8.0)
