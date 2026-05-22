# ELD Trip Planner — Frontend

React + Vite client for planning FMCSA-style truck trips, viewing routes and stops, and rendering filled driver daily log sheets (SVG).

## Requirements

- Node.js 18+
- Backend API running at `http://127.0.0.1:8000` (see project root `README.md`)

## Quick start

```bash
cd frontend
npm install
cp .env.example .env   # optional — defaults to http://127.0.0.1:8000
npm run dev
```

Open **http://localhost:5173**

## Environment

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Django API origin (default: `http://127.0.0.1:8000`) |

Example `.env`:

```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Run backend + frontend together

**Terminal 1 — backend**

```bash
cd backend
source ../.venv/bin/activate   # or your venv path
python manage.py migrate
python manage.py runserver
```

**Terminal 2 — frontend**

```bash
cd frontend
npm run dev
```

CORS is configured for `http://localhost:5173`.

## Main features

- **Trip form** — locations, cycle hours, start time, optional log sheet metadata
- **Load Sample Trip** — Dallas → Houston → Atlanta demo payload
- **Trip summary** — miles, driving/on-duty hours, cycle usage, log sheet count
- **Route map** — OpenStreetMap + Leaflet polyline and markers
- **Stops timeline** — pickup, dropoff, fuel, break, rest, restart
- **Daily log sheets** — SVG 24-hour grids (primary deliverable); tabs per day; **Print Logs**

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

## Tech stack

- React 19 + Vite 8
- Tailwind CSS v4
- Axios, React Hook Form, Dayjs
- React Leaflet + Leaflet

## Project structure

```
src/
  api/tripApi.js
  components/
    common/       Buttons, cards, loading, compliance note
    layout/       Header, page shell
    trip/         Form, summary, planner page
    map/          Route map
    logs/         Daily log SVG sheets
  utils/          Formatters, payload, map, log drawing
```

## Known simplifications (UI reflects backend)

- Assessment-grade HOS rules only (not certified ELD)
- Stop markers on map only when coordinates exist on stops (route endpoints always shown)
- Public geocoding/routing may return estimated distances
- Print layout optimized for log sheets; use landscape if the browser prompts

## Manual test checklist

1. Load Sample Trip → Generate Route & Logs  
2. Confirm summary cards, map polyline, stops timeline  
3. Switch daily log tabs; verify 24-hour totals  
4. Print Logs (preview should hide form/map/timeline)  
5. Submit invalid location (`test`) — friendly error, no raw JSON  
6. Resize to mobile width — form stacks, log graph scrolls horizontally  
