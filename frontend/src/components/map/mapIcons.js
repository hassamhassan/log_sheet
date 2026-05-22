import L from 'leaflet'
import { MARKER_KIND_NAMES, MARKER_LABELS } from '../../utils/mapUtils'

const MARKER_STYLES = {
  current: { color: '#2563eb', border: '#1d4ed8' },
  pickup: { color: '#059669', border: '#047857' },
  dropoff: { color: '#dc2626', border: '#b91c1c' },
  fuel: { color: '#d97706', border: '#b45309' },
  break: { color: '#2563eb', border: '#1d4ed8' },
  rest: { color: '#7c3aed', border: '#6d28d9' },
  restart: { color: '#334155', border: '#1e293b' },
  default: { color: '#64748b', border: '#475569' },
}

export function createDivIcon(kind, label) {
  const style = MARKER_STYLES[kind] ?? MARKER_STYLES.default
  const text = label ?? MARKER_LABELS[kind] ?? '?'
  const isWide = String(text).length > 1
  const size = isWide ? 36 : 30
  const ariaLabel = MARKER_KIND_NAMES[kind] ?? `Route marker ${text}`

  return L.divIcon({
    className: 'eld-map-marker',
    html: `<div class="eld-map-marker-pin ${isWide ? 'eld-map-marker-pin--wide' : ''}" role="img" aria-label="${ariaLabel}" style="--marker-bg:${style.color};--marker-border:${style.border}"><span aria-hidden="true">${text}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 2)],
  })
}

/** Prevent broken default Leaflet marker assets in Vite */
let defaultIconFixed = false

export function ensureDefaultLeafletIcons() {
  if (defaultIconFixed) return
  defaultIconFixed = true

  const iconUrl = new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href
  const iconRetinaUrl = new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href
  const shadowUrl = new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href

  L.Icon.Default.mergeOptions({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
  })
}

export const MAP_LEGEND_ITEMS = [
  { label: 'C', name: 'Current', kind: 'current' },
  { label: 'P', name: 'Pickup', kind: 'pickup' },
  { label: 'D', name: 'Dropoff', kind: 'dropoff' },
  { label: 'F', name: 'Fuel', kind: 'fuel' },
  { label: 'R', name: 'Rest', kind: 'rest' },
  { label: '34', name: 'Restart', kind: 'restart' },
  { label: 'B', name: 'Break', kind: 'break' },
]
