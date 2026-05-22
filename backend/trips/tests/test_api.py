from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from trips.models import Trip

VALID_PAYLOAD = {
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
}

MOCK_ROUTE = {
    'total_miles': 1032.0,
    'total_duration_hours': 16.9,
    'estimated': False,
    'geometry': [[32.78, -96.80], [29.76, -95.37], [33.75, -84.39]],
    'segments': [
        {
            'type': 'current_to_pickup',
            'from_location': 'Dallas, TX',
            'to_location': 'Houston, TX',
            'distance_miles': 239.0,
            'duration_hours': 4.2,
            'geometry': [[32.78, -96.80], [29.76, -95.37]],
        },
        {
            'type': 'pickup_to_dropoff',
            'from_location': 'Houston, TX',
            'to_location': 'Atlanta, GA',
            'distance_miles': 793.0,
            'duration_hours': 12.7,
            'geometry': [[29.76, -95.37], [33.75, -84.39]],
        },
    ],
}

MOCK_ROUTE_LONG = {
    'total_miles': 1400.0,
    'total_duration_hours': 25.0,
    'estimated': True,
    'geometry': [[32.0, -96.0], [30.0, -95.0], [33.0, -84.0]],
    'segments': [
        {
            'type': 'current_to_pickup',
            'from_location': 'Dallas, TX',
            'to_location': 'Houston, TX',
            'distance_miles': 200.0,
            'duration_hours': 4.0,
            'geometry': [[32.0, -96.0], [30.0, -95.0]],
        },
        {
            'type': 'pickup_to_dropoff',
            'from_location': 'Houston, TX',
            'to_location': 'Atlanta, GA',
            'distance_miles': 1200.0,
            'duration_hours': 21.0,
            'geometry': [[30.0, -95.0], [33.0, -84.0]],
        },
    ],
}


class TripPlanAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_endpoint(self):
        response = self.client.get('/api/health/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'ok')
        self.assertEqual(response.data['message'], 'ELD Trip Planner API running')

    @patch('trips.services.trip_planner.build_route', return_value=MOCK_ROUTE)
    def test_valid_trip_plan_returns_201(self, mock_route):
        response = self.client.post('/api/trips/plan/', VALID_PAYLOAD, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertIn('trip_id', response.data)
        mock_route.assert_called_once()

    @patch('trips.services.trip_planner.build_route', return_value=MOCK_ROUTE)
    def test_invalid_cycle_over_70_returns_400(self, mock_route):
        payload = {**VALID_PAYLOAD, 'current_cycle_used_hours': 75}
        response = self.client.post('/api/trips/plan/', payload, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('current_cycle_used_hours', response.data)
        mock_route.assert_not_called()

    @patch('trips.services.trip_planner.build_route', return_value=MOCK_ROUTE)
    @patch('trips.services.trip_planner.create_trip_plan')
    def test_placeholder_locations_return_400(self, mock_create, mock_route):
        payload = {
            **VALID_PAYLOAD,
            'current_location': 'string',
            'pickup_location': 'string',
            'dropoff_location': 'string',
        }
        response = self.client.post('/api/trips/plan/', payload, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('current_location', response.data)
        self.assertIn('pickup_location', response.data)
        self.assertIn('dropoff_location', response.data)
        mock_route.assert_not_called()
        mock_create.assert_not_called()

    @patch('trips.services.trip_planner.build_route', return_value=MOCK_ROUTE)
    def test_placeholder_locations_do_not_create_trip(self, mock_route):
        initial_count = Trip.objects.count()
        payload = {
            **VALID_PAYLOAD,
            'current_location': 'string',
            'pickup_location': 'string',
            'dropoff_location': 'string',
        }
        response = self.client.post('/api/trips/plan/', payload, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Trip.objects.count(), initial_count)
        mock_route.assert_not_called()

    @patch('trips.services.trip_planner.build_route', return_value=MOCK_ROUTE)
    def test_response_includes_required_sections(self, mock_route):
        response = self.client.post('/api/trips/plan/', VALID_PAYLOAD, format='json')

        self.assertEqual(response.status_code, 201)
        for key in ('summary', 'route', 'stops', 'daily_logs'):
            self.assertIn(key, response.data)
        self.assertIn('geometry', response.data['route'])
        self.assertIn('segments', response.data['route'])

    @patch('trips.services.trip_planner.build_route', return_value=MOCK_ROUTE)
    def test_summary_cycle_field_naming(self, mock_route):
        response = self.client.post('/api/trips/plan/', VALID_PAYLOAD, format='json')
        summary = response.data['summary']

        self.assertEqual(summary['initial_cycle_used_hours'], 20.0)
        self.assertEqual(summary['current_cycle_used_hours'], 20.0)
        self.assertGreater(summary['trip_on_duty_hours'], 0)
        self.assertGreater(summary['final_cycle_used_hours'], summary['initial_cycle_used_hours'])
        self.assertEqual(
            summary['remaining_cycle_hours'],
            round(max(0.0, 70.0 - summary['final_cycle_used_hours']), 2),
        )

    @patch('trips.services.trip_planner.build_route', return_value=MOCK_ROUTE)
    def test_saved_trip_exists_after_planning(self, mock_route):
        response = self.client.post('/api/trips/plan/', VALID_PAYLOAD, format='json')

        trip = Trip.objects.get(pk=response.data['trip_id'])
        self.assertEqual(trip.current_location, 'Dallas, TX')
        self.assertEqual(trip.current_cycle_used_hours, 20.0)
        self.assertGreater(trip.total_miles, 0)
        self.assertTrue(trip.route_data)
        self.assertTrue(trip.route_data.get('cycle_summary'))
        self.assertTrue(trip.daily_logs)

    @patch('trips.services.trip_planner.build_route', return_value=MOCK_ROUTE)
    def test_each_daily_log_totals_24(self, mock_route):
        response = self.client.post('/api/trips/plan/', VALID_PAYLOAD, format='json')

        for daily_log in response.data['daily_logs']:
            self.assertEqual(daily_log['totals']['total'], 24.0)

    @patch('trips.services.trip_planner.build_route', return_value=MOCK_ROUTE_LONG)
    def test_long_route_generates_multiple_daily_logs(self, mock_route):
        response = self.client.post('/api/trips/plan/', VALID_PAYLOAD, format='json')

        self.assertGreater(len(response.data['daily_logs']), 1)
        self.assertGreater(response.data['summary']['number_of_log_sheets'], 1)

    @patch('trips.services.trip_planner.build_route', return_value=MOCK_ROUTE)
    def test_get_trip_detail_returns_saved_plan(self, mock_route):
        plan_response = self.client.post('/api/trips/plan/', VALID_PAYLOAD, format='json')
        trip_id = plan_response.data['trip_id']

        detail_response = self.client.get(f'/api/trips/{trip_id}/')

        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.data['trip_id'], trip_id)
        self.assertEqual(len(detail_response.data['daily_logs']), len(plan_response.data['daily_logs']))

    @patch('trips.services.trip_planner.build_route', return_value=MOCK_ROUTE)
    def test_trip_detail_returns_saved_json_fields(self, mock_route):
        plan_response = self.client.post('/api/trips/plan/', VALID_PAYLOAD, format='json')
        trip_id = plan_response.data['trip_id']

        detail_response = self.client.get(f'/api/trips/{trip_id}/')

        self.assertIn('route', detail_response.data)
        self.assertIn('stops', detail_response.data)
        self.assertIn('daily_logs', detail_response.data)
        self.assertIn('summary', detail_response.data)
        self.assertEqual(detail_response.data['route']['geometry'], plan_response.data['route']['geometry'])

    @patch('trips.services.trip_planner.build_route', return_value=MOCK_ROUTE)
    def test_get_trip_list_returns_summaries(self, mock_route):
        self.client.post('/api/trips/plan/', VALID_PAYLOAD, format='json')

        list_response = self.client.get('/api/trips/')

        self.assertEqual(list_response.status_code, 200)
        self.assertGreaterEqual(len(list_response.data), 1)
        self.assertIn('total_miles', list_response.data[0])

    @patch('trips.services.trip_planner.build_route')
    def test_geocoding_failure_returns_400(self, mock_route):
        from trips.services.exceptions import GeocodingError

        mock_route.side_effect = GeocodingError('Could not resolve location: "Nowhere"')
        payload = {**VALID_PAYLOAD, 'current_location': 'Nowhere'}
        response = self.client.post('/api/trips/plan/', payload, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)
        self.assertNotIn('traceback', str(response.data).lower())

    @patch('trips.services.trip_planner.build_route', return_value=MOCK_ROUTE)
    def test_hos_rules_in_events(self, mock_route):
        response = self.client.post('/api/trips/plan/', VALID_PAYLOAD, format='json')

        event_types = set()
        for daily_log in response.data['daily_logs']:
            for event in daily_log['events']:
                event_types.add(event['type'])

        stops_types = {stop['type'] for stop in response.data['stops']}
        self.assertTrue({'pickup', 'dropoff'}.issubset(stops_types) or 'pickup' in event_types)

    @patch('trips.services.trip_planner.build_route', return_value=MOCK_ROUTE_LONG)
    def test_fuel_stop_on_long_route(self, mock_route):
        response = self.client.post('/api/trips/plan/', VALID_PAYLOAD, format='json')

        stop_types = {stop['type'] for stop in response.data['stops']}
        self.assertIn('fuel', stop_types)

    @patch('trips.services.trip_planner.build_route', return_value=MOCK_ROUTE)
    def test_cycle_near_70_triggers_restart(self, mock_route):
        payload = {**VALID_PAYLOAD, 'current_cycle_used_hours': 69}
        response = self.client.post('/api/trips/plan/', payload, format='json')

        stop_types = {stop['type'] for stop in response.data['stops']}
        self.assertIn('restart', stop_types)

    @patch('trips.services.trip_planner.build_route', return_value=MOCK_ROUTE)
    def test_stops_have_required_fields(self, mock_route):
        response = self.client.post('/api/trips/plan/', VALID_PAYLOAD, format='json')

        required_fields = {
            'type', 'status', 'start_datetime', 'end_datetime',
            'duration_hours', 'distance_miles', 'location', 'remark',
        }
        for stop in response.data['stops']:
            self.assertEqual(required_fields, set(stop.keys()))
            self.assertIsNotNone(stop['status'])
            self.assertIsNotNone(stop['duration_hours'])
            self.assertGreater(stop['duration_hours'], 0)
            self.assertIsNotNone(stop['start_datetime'])
            self.assertIsNotNone(stop['end_datetime'])
            self.assertTrue(stop['remark'])

        for daily_log in response.data['daily_logs']:
            self.assertEqual(daily_log['totals']['total'], 24.0)
