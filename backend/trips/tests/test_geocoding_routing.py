from unittest.mock import patch

from django.test import TestCase

from trips.services.exceptions import GeocodingError, RoutePlanningError
from trips.services.geocoding_service import geocode_location
from trips.services.routing_service import build_route, simplify_geometry

DALLAS = {'lat': 32.7767, 'lng': -96.7970, 'display_name': 'Dallas, TX, USA'}
HOUSTON = {'lat': 29.7604, 'lng': -95.3698, 'display_name': 'Houston, TX, USA'}
ATLANTA = {'lat': 33.7490, 'lng': -84.3880, 'display_name': 'Atlanta, GA, USA'}


class GeocodingServiceTests(TestCase):
    @patch('trips.services.geocoding_service.requests.get')
    def test_geocoding_success(self, mock_get):
        mock_get.return_value.ok = True
        mock_get.return_value.raise_for_status.return_value = None
        mock_get.return_value.json.return_value = [
            {
                'lat': '32.7767',
                'lon': '-96.7970',
                'display_name': 'Dallas, TX, USA',
            }
        ]

        result = geocode_location('Dallas, TX')

        self.assertEqual(result['lat'], 32.7767)
        self.assertEqual(result['lng'], -96.7970)
        self.assertEqual(result['display_name'], 'Dallas, TX, USA')
        mock_get.assert_called_once()
        call_kwargs = mock_get.call_args.kwargs
        self.assertIn('User-Agent', call_kwargs['headers'])
        self.assertEqual(call_kwargs['headers']['Accept-Language'], 'en')
        self.assertEqual(call_kwargs['params']['accept-language'], 'en')

    @patch('trips.services.geocoding_service.requests.get')
    def test_geocoding_failure(self, mock_get):
        mock_get.return_value.ok = True
        mock_get.return_value.raise_for_status.return_value = None
        mock_get.return_value.json.return_value = []

        with self.assertRaises(GeocodingError):
            geocode_location('Unknown Place XYZ')


class SimplifyGeometryTests(TestCase):
    def _make_points(self, count):
        return [[float(i), float(-i)] for i in range(count)]

    def test_large_geometry_reduced_to_max_plus_endpoints(self):
        points = self._make_points(10000)
        result = simplify_geometry(points, max_points=500)

        self.assertLessEqual(len(result), 501)
        self.assertEqual(result[0], points[0])
        self.assertEqual(result[-1], points[-1])

    def test_short_geometry_unchanged(self):
        points = [[32.0, -96.0], [30.0, -95.0], [29.0, -94.0]]
        result = simplify_geometry(points, max_points=500)

        self.assertEqual(result, points)

    def test_empty_geometry_unchanged(self):
        self.assertEqual(simplify_geometry([]), [])


class RoutingServiceTests(TestCase):
    @patch('trips.services.routing_service.requests.get')
    @patch('trips.services.routing_service.geocode_location')
    def test_osrm_request_uses_simplified_geometry(self, mock_geocode, mock_get):
        mock_geocode.side_effect = [DALLAS, HOUSTON, ATLANTA]
        mock_get.return_value.ok = True
        mock_get.return_value.raise_for_status.return_value = None
        mock_get.return_value.json.return_value = {
            'code': 'Ok',
            'routes': [{
                'distance': 100000,
                'duration': 3600,
                'geometry': {
                    'coordinates': [[-96.8, 32.78], [-95.36, 29.76]],
                },
            }],
        }

        build_route('Dallas, TX', 'Houston, TX', 'Atlanta, GA')

        request_url = mock_get.call_args.args[0]
        self.assertIn('overview=simplified', request_url)
        self.assertIn('geometries=geojson', request_url)
        self.assertIn('steps=false', request_url)
        self.assertNotIn('overview=full', request_url)

    @patch('trips.services.routing_service._fetch_osrm_leg')
    @patch('trips.services.routing_service.geocode_location')
    def test_build_route_simplifies_large_geometry(self, mock_geocode, mock_osrm):
        large_geometry = [[float(i), float(-i)] for i in range(6000)]
        mock_geocode.side_effect = [DALLAS, HOUSTON, ATLANTA]
        mock_osrm.side_effect = [
            {
                'distance_miles': 239.0,
                'duration_hours': 4.2,
                'geometry': large_geometry,
            },
            {
                'distance_miles': 793.0,
                'duration_hours': 12.7,
                'geometry': large_geometry,
            },
        ]

        result = build_route('Dallas, TX', 'Houston, TX', 'Atlanta, GA')

        self.assertLessEqual(len(result['geometry']), 501)
        for segment in result['segments']:
            self.assertLessEqual(len(segment['geometry']), 251)

    @patch('trips.services.routing_service._fetch_osrm_leg')
    @patch('trips.services.routing_service.geocode_location')
    def test_build_route_osrm_success(self, mock_geocode, mock_osrm):
        mock_geocode.side_effect = [DALLAS, HOUSTON, ATLANTA]
        mock_osrm.side_effect = [
            {
                'distance_miles': 239.0,
                'duration_hours': 4.2,
                'geometry': [[32.77, -96.79], [29.76, -95.36]],
            },
            {
                'distance_miles': 793.0,
                'duration_hours': 12.7,
                'geometry': [[29.76, -95.36], [33.74, -84.38]],
            },
        ]

        result = build_route('Dallas, TX', 'Houston, TX', 'Atlanta, GA')

        self.assertEqual(result['total_miles'], 1032.0)
        self.assertEqual(result['total_duration_hours'], 16.9)
        self.assertFalse(result['estimated'])
        self.assertEqual(len(result['segments']), 2)
        self.assertEqual(len(result['geometry']), 3)
        self.assertEqual(result['segments'][0]['type'], 'current_to_pickup')
        self.assertEqual(result['segments'][1]['type'], 'pickup_to_dropoff')

    @patch('trips.services.routing_service._fetch_osrm_leg')
    @patch('trips.services.routing_service.geocode_location')
    def test_routing_fallback_to_haversine(self, mock_geocode, mock_osrm):
        mock_geocode.side_effect = [DALLAS, HOUSTON, ATLANTA]
        mock_osrm.side_effect = RoutePlanningError('Routing unavailable')

        result = build_route('Dallas, TX', 'Houston, TX', 'Atlanta, GA')

        self.assertTrue(result['estimated'])
        self.assertGreater(result['total_miles'], 0)
        self.assertGreater(result['total_duration_hours'], 0)
        self.assertEqual(len(result['segments']), 2)
        self.assertTrue(all(segment['geometry'] for segment in result['segments']))
        self.assertEqual(len(result['geometry']), 3)

    @patch('trips.services.routing_service.geocode_location')
    def test_geocoding_failure_raises_route_planning_error(self, mock_geocode):
        mock_geocode.side_effect = GeocodingError('Could not resolve location: "Nowhere"')

        with self.assertRaises(RoutePlanningError):
            build_route('Nowhere', 'Houston, TX', 'Atlanta, GA')

    @patch('trips.services.routing_service._fetch_osrm_leg')
    @patch('trips.services.routing_service.geocode_location')
    def test_output_contains_required_fields(self, mock_geocode, mock_osrm):
        mock_geocode.side_effect = [DALLAS, HOUSTON, ATLANTA]
        mock_osrm.return_value = {
            'distance_miles': 100.0,
            'duration_hours': 2.0,
            'geometry': [[32.0, -96.0], [30.0, -95.0]],
        }

        result = build_route('Dallas, TX', 'Houston, TX', 'Atlanta, GA')

        self.assertIn('total_miles', result)
        self.assertIn('geometry', result)
        self.assertIn('segments', result)
        self.assertIn('estimated', result)
        for segment in result['segments']:
            self.assertIn('distance_miles', segment)
            self.assertIn('duration_hours', segment)
            self.assertIn('geometry', segment)
