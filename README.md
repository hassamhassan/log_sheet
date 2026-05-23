# ELD Trip Planner

Backend API for planning truck trips with Hours-of-Service (HOS) scheduling, daily ELD log sheets, and map-ready route geometry. Built for integration with a React frontend.

## Project overview

The app accepts a driver's current location, pickup, dropoff, trip start time, and cycle hours used. It returns:

- Route geometry and segment breakdown
- HOS-compliant duty events (driving, breaks, fuel, rest, pickup, dropoff)
- One filled daily log sheet per calendar day (24 hours each)
- Saved trip history in PostgreSQL

## Backend tech stack

- **Python 3.12+**
- **Django 6** + **Django REST Framework**
- **drf-spectacular** (OpenAPI / Swagger)
- **django-cors-headers** (React dev server)
- **PostgreSQL** (database)
- **requests** (Nominatim geocoding, OSRM routing)
- **python-dotenv** (optional env loading)

## Setup

### 1. Create virtual environment

```bash
cd /path/to/tripe-logs
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Start PostgreSQL

With Docker (recommended):

```bash
docker compose up -d db
```

Or install PostgreSQL locally and create a database/user matching `backend/.env.example`.

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env if your Postgres credentials differ
```

### 4. Install dependencies

```bash
pip install -r backend/requirements.txt
```

### 5. Run migrations

```bash
cd backend
python manage.py migrate
```

### 6. Run development server

```bash
cd backend
python manage.py runserver
```

API base URL: `http://127.0.0.1:8000`

Swagger UI: `http://127.0.0.1:8000/api/docs/`

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health/` | Health check |
| POST | `/api/trips/plan/` | Plan and save a trip |
| GET | `/api/trips/` | List saved trips |
| GET | `/api/trips/<id>/` | Trip detail (route, stops, daily logs) |
| GET | `/api/docs/` | Swagger UI |
| GET | `/api/schema/` | OpenAPI schema |

## Sample request body

`POST /api/trips/plan/`

```json
{
  "current_location": "Dallas, TX",
  "pickup_location": "Houston, TX",
  "dropoff_location": "Atlanta, GA",
  "current_cycle_used_hours": 20,
  "start_datetime": "2026-05-21T08:00:00Z",
  "driver_name": "John Driver",
  "carrier_name": "Demo Carrier",
  "main_office_address": "Dallas, TX",
  "vehicle_number": "TRK-100",
  "trailer_number": "TRL-900",
  "shipping_document": "BOL-12345"
}
```

## curl examples

### Health

```bash
curl http://127.0.0.1:8000/api/health/
```

### Plan a trip

```bash
curl -X POST http://127.0.0.1:8000/api/trips/plan/ \
  -H "Content-Type: application/json" \
  -d '{
    "current_location": "Dallas, TX",
    "pickup_location": "Houston, TX",
    "dropoff_location": "Atlanta, GA",
    "current_cycle_used_hours": 20,
    "start_datetime": "2026-05-21T08:00:00Z",
    "driver_name": "John Driver",
    "carrier_name": "Demo Carrier",
    "main_office_address": "Dallas, TX",
    "vehicle_number": "TRK-100",
    "trailer_number": "TRL-900",
    "shipping_document": "BOL-12345"
  }'
```

### List trips

```bash
curl http://127.0.0.1:8000/api/trips/
```

### Trip detail

```bash
curl http://127.0.0.1:8000/api/trips/1/
```

## HOS assumptions implemented

| Rule | Value |
|------|-------|
| Max driving per shift | 11 hours |
| Max duty window | 14 hours |
| Break after driving | 8 hours → 30 min off-duty |
| Daily rest | 10 hours off-duty |
| Cycle limit | 70 hours |
| Cycle restart | 34 hours off-duty |
| Pickup / dropoff | 1 hour on-duty (not driving) each |
| Fuel stop | Every 1,000 miles, 30 min on-duty |
| Fallback travel speed | 55 mph (haversine estimate) |

Pickup, dropoff, and fuel stops of 30+ minutes count as valid break time.

## Known simplifications

The scheduler is **educational/demo-grade**, not certified ELD compliance software:

- No sleeper berth split rules
- No personal conveyance
- No short-haul exceptions
- No adverse driving conditions
- No real ELD device integration
- Public Nominatim/OSRM APIs (rate limits, no SLA)
- Haversine fallback when OSRM is unavailable (`estimated: true`)

## Project structure

```
backend/
  manage.py
  tripe_log/          # Django project settings & URLs
  trips/
    api_helpers.py    # Shared API error/health helpers
    models.py
    serializers.py
    views.py          # Thin API views
    services/
      constants.py    # HOS & API constants
      geocoding_service.py
      routing_service.py
      hos_scheduler.py
      log_generator.py
      trip_planner.py # Orchestration
    tests/
```

## Running tests

```bash
cd backend
python manage.py check
python manage.py test trips.tests -v 2
```

## Error responses

```json
{
  "error": "Human-readable message",
  "details": {}
}
```

Validation errors return HTTP 400 with field details under `details`.

## Frontend (React + Vite)

Full UI lives in `frontend/`. See **[frontend/README.md](frontend/README.md)** for setup details.

### Run frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_BASE_URL=http://127.0.0.1:8000` in `frontend/.env` (default).

### Run both services

| Service | Command | URL |
|---------|---------|-----|
| Backend | `cd backend && python manage.py runserver` | http://127.0.0.1:8000 |
| Frontend | `cd frontend && npm run dev` | http://localhost:5173 |

### Frontend features

- Trip input form with sample trip and reset
- HOS trip summary cards
- OpenStreetMap route map with markers
- Stops & rests timeline
- **Filled daily log sheets** (SVG, printable) — primary assessment output

### Frontend integration notes

- CORS allows `http://localhost:5173`.
- Main workflow: `POST /api/trips/plan/`.
- `route.geometry` is `[lat, lng]` pairs for Leaflet.
- `daily_logs[].events` use `start_minutes` / `end_minutes` (0–1440) for the log grid.
- Each `daily_logs[].totals.total` is always **24**.

### Frontend known simplifications

- UI displays backend assessment assumptions (70 hr / 8 day, fuel every 1,000 mi, etc.).
- Not a certified ELD device or compliance product.
- Map stop pins only when backend includes coordinates on stops.
