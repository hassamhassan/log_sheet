import { useMemo } from 'react'
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
} from 'react-leaflet'
import { Map } from 'lucide-react'
import Card from '../common/Card'
import { cardSurface } from '../common/uiClasses'
import { buildMapMarkers, collectFitBoundsPoints } from '../../utils/mapUtils'
import { titleCaseType } from '../../utils/formatters'
import { MAP_LEGEND_ITEMS, createDivIcon, ensureDefaultLeafletIcons } from './mapIcons'
import MapFitBounds from './MapFitBounds'
import RouteLinePopup from './RouteLinePopup'
import StopPopupContent from './StopPopupContent'

ensureDefaultLeafletIcons()

const DEFAULT_CENTER = [39.8283, -98.5795]
const DEFAULT_ZOOM = 4

const LEGEND_PIN_CLASS = {
  current: 'bg-blue-600 border-blue-700',
  pickup: 'bg-emerald-600 border-emerald-700',
  dropoff: 'bg-red-600 border-red-700',
  fuel: 'bg-amber-600 border-amber-700',
  rest: 'bg-purple-600 border-purple-700',
  restart: 'bg-slate-700 border-slate-900',
  break: 'bg-blue-600 border-blue-700',
}

const ROUTE_PATH = {
  color: '#2563eb',
  weight: 5,
  opacity: 0.85,
  lineCap: 'round',
  lineJoin: 'round',
}

function markerTooltipTitle(marker) {
  const kind = marker?.kind ?? marker?.stop?.type
  const label = titleCaseType(kind)
  const location = marker?.stop?.location
  return location ? `${label} — ${location}` : label
}

function MapLegendCard() {
  return (
    <div
      className={[
        cardSurface,
        'flex flex-wrap items-center gap-x-4 gap-y-2.5 px-4 py-3.5 text-xs text-slate-600 sm:px-5 sm:py-4',
      ].join(' ')}
      aria-label="Map legend"
    >
      <span className="w-full text-xs font-semibold uppercase tracking-wide text-slate-500 sm:w-auto sm:normal-case sm:tracking-normal">
        Legend
      </span>
      {MAP_LEGEND_ITEMS.map(({ label, name, kind }) => (
        <span key={kind} className="inline-flex items-center gap-1.5">
          <span
            className={[
              'inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-0.5 text-[10px] font-bold text-white shadow-sm',
              LEGEND_PIN_CLASS[kind] ?? 'bg-slate-500 border-slate-600',
              label.length > 1 ? 'min-w-[1.35rem]' : '',
            ].join(' ')}
            aria-hidden
          >
            {label}
          </span>
          <span className="font-medium text-slate-800">{name}</span>
        </span>
      ))}
    </div>
  )
}

function RouteMapUnavailable() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-14 text-center sm:px-6 sm:py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
        <Map className="h-6 w-6" aria-hidden />
      </div>
      <div className="max-w-sm">
        <p className="text-sm font-semibold text-slate-800">Route map unavailable</p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          No route geometry was returned for this trip. Stop details remain available in the
          timeline below.
        </p>
      </div>
    </div>
  )
}

function RouteMapView({ route, stops }) {
  const { markers, positions } = useMemo(
    () => buildMapMarkers(route, stops),
    [route, stops],
  )

  const fitPoints = useMemo(
    () => collectFitBoundsPoints(positions, markers),
    [positions, markers],
  )

  const initialCenter = fitPoints[0] ?? DEFAULT_CENTER
  const hasPolyline = positions.length > 1

  return (
    <div className="space-y-3 p-3 sm:space-y-4 sm:p-4">
      <div className="route-map-frame min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-md shadow-slate-900/10 ring-1 ring-slate-200/90">
        <div
          className="route-map-container relative w-full max-w-full"
          role="application"
          aria-label="Interactive route map. Use mouse or touch to pan and zoom. Select markers for stop details."
        >
          <MapContainer
            center={initialCenter}
            zoom={DEFAULT_ZOOM}
            scrollWheelZoom
            className="route-map-leaflet z-0 h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapFitBounds positions={fitPoints} />

            {hasPolyline && (
              <Polyline positions={positions} pathOptions={ROUTE_PATH}>
                <Tooltip sticky direction="top" opacity={0.92} className="route-line-tooltip">
                  Planned route — click for details
                </Tooltip>
                <Popup closeButton>
                  <RouteLinePopup route={route} />
                </Popup>
              </Polyline>
            )}

            {markers.map((marker) => (
              <Marker
                key={marker.id}
                position={marker.position}
                icon={createDivIcon(marker.kind, marker.label)}
                eventHandlers={{
                  add: (e) => {
                    const el = e.target.getElement?.()
                    if (el) el.setAttribute('tabindex', '0')
                  },
                }}
              >
                <Tooltip direction="top" offset={[0, -18]} opacity={0.92}>
                  {markerTooltipTitle(marker)}
                </Tooltip>
                <Popup closeButton closeOnEscapeKey>
                  <StopPopupContent marker={marker} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      <MapLegendCard />
    </div>
  )
}

export default function RouteMap({ route, stops }) {
  const { positions } = useMemo(() => buildMapMarkers(route, stops), [route, stops])
  const hasGeometry = positions.length > 0

  return (
    <Card
      title="Route map"
      description="Route polyline with current, pickup, dropoff, and scheduled stop markers"
      padding={false}
    >
      {hasGeometry ? (
        <RouteMapView route={route} stops={stops} />
      ) : (
        <div className="p-3 sm:p-4">
          <RouteMapUnavailable />
        </div>
      )}
    </Card>
  )
}
