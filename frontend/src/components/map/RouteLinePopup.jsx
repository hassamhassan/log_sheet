import { formatMiles } from '../../utils/formatters'

export default function RouteLinePopup({ route }) {
  const segments = Array.isArray(route?.segments) ? route.segments : []
  const pointCount = Array.isArray(route?.geometry) ? route.geometry.length : 0
  const segmentMiles = segments.reduce(
    (sum, seg) => sum + (Number(seg?.distance_miles) || 0),
    0,
  )
  const displayMiles = route?.total_miles ?? (segmentMiles > 0 ? segmentMiles : null)

  return (
    <div className="min-w-[10rem] text-sm text-slate-800">
      <p className="font-semibold text-slate-900">Planned route</p>
      {displayMiles != null && (
        <p className="mt-1.5">
          <span className="font-medium text-slate-500">Distance: </span>
          {formatMiles(displayMiles)}
        </p>
      )}
      {segments.length > 0 && (
        <p className="mt-1 text-slate-600">
          {segments.length} leg{segments.length === 1 ? '' : 's'}
        </p>
      )}
      {pointCount > 0 && (
        <p className="mt-1 text-xs text-slate-500">{pointCount} map points</p>
      )}
      <p className="mt-2 text-xs text-slate-400">Click markers for stop details</p>
    </div>
  )
}
