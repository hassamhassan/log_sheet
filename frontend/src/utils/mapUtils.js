/** Normalize backend [lat, lng] pairs for Leaflet */
export function normalizeLatLngPair(point) {
  if (!Array.isArray(point) || point.length < 2) return null
  const lat = Number(point[0])
  const lng = Number(point[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return [lat, lng]
}

export const MARKER_LABELS = {
  current: 'C',
  pickup: 'P',
  dropoff: 'D',
  fuel: 'F',
  rest: 'R',
  restart: '34',
  break: 'B',
}

/** Accessible names for map markers (screen readers) */
export const MARKER_KIND_NAMES = {
  current: 'Current location',
  pickup: 'Pickup location',
  dropoff: 'Dropoff location',
  fuel: 'Fuel stop',
  rest: 'Rest stop',
  restart: '34-hour restart',
  break: 'Break stop',
}

export function getRoutePositions(geometry) {
  if (!Array.isArray(geometry)) return []
  return geometry.map(normalizeLatLngPair).filter(Boolean)
}

export function getStopCoordinates(stop) {
  if (!stop || typeof stop !== 'object') return null

  if (stop.lat != null && stop.lng != null) {
    return normalizeLatLngPair([stop.lat, stop.lng])
  }
  if (stop.latitude != null && stop.longitude != null) {
    return normalizeLatLngPair([stop.latitude, stop.longitude])
  }
  if (Array.isArray(stop.coordinates)) {
    return normalizeLatLngPair(stop.coordinates)
  }
  if (Array.isArray(stop.position)) {
    return normalizeLatLngPair(stop.position)
  }

  return null
}

function findSegment(segments, type) {
  if (!Array.isArray(segments)) return null
  return segments.find((seg) => seg?.type === type) ?? null
}

function segmentEndpoint(segment, which) {
  const geometry = segment?.geometry
  if (!Array.isArray(geometry) || geometry.length === 0) return null
  const point = which === 'start' ? geometry[0] : geometry[geometry.length - 1]
  return normalizeLatLngPair(point)
}

function nearestIndex(positions, point) {
  if (!point || !positions.length) return 0
  let best = 0
  let bestDist = Infinity
  positions.forEach((pos, i) => {
    const d = (pos[0] - point[0]) ** 2 + (pos[1] - point[1]) ** 2
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  })
  return best
}

/** Slight offset so overlapping markers remain visible */
export function offsetForOverlap(base, overlapIndex) {
  if (!base || overlapIndex <= 0) return base
  const angle = ((overlapIndex * 67) % 360) * (Math.PI / 180)
  const delta = 0.012 * overlapIndex
  return [base[0] + delta * Math.cos(angle), base[1] + delta * Math.sin(angle)]
}

function estimateStopPosition(positions, pickupIdx, stop, allStops) {
  if (!positions.length) return null

  const type = (stop?.type ?? '').toLowerCase()

  if (type === 'pickup') {
    return positions[pickupIdx] ?? positions[0]
  }
  if (type === 'dropoff') {
    return positions[positions.length - 1]
  }

  const enRoute = allStops
    .filter((s) => ['fuel', 'rest', 'break', 'restart'].includes((s?.type ?? '').toLowerCase()))
    .sort(
      (a, b) =>
        new Date(a.start_datetime ?? 0).getTime() -
        new Date(b.start_datetime ?? 0).getTime(),
    )

  const idx = enRoute.indexOf(stop)
  if (idx < 0) {
    return positions[Math.floor(positions.length / 2)]
  }

  const start = pickupIdx ?? 0
  const end = positions.length - 1
  const span = Math.max(1, end - start)
  const pointIdx = Math.min(
    end,
    start + Math.round((span * (idx + 1)) / (enRoute.length + 1)),
  )
  return positions[pointIdx]
}

/**
 * Build map markers from route geometry/segments and stops.
 * Stops without lat/lng are placed along the route polyline (timeline still has full detail).
 */
export function buildMapMarkers(route, stops) {
  const markers = []
  const overlapBuckets = new Map()
  const positions = getRoutePositions(route?.geometry)

  const placeMarker = (marker) => {
    let pos = marker.position
    if (!pos) return

    const bucketKey = `${pos[0].toFixed(4)},${pos[1].toFixed(4)}`
    const overlapCount = overlapBuckets.get(bucketKey) ?? 0
    if (overlapCount > 0) {
      pos = offsetForOverlap(marker.position, overlapCount)
    }
    overlapBuckets.set(bucketKey, overlapCount + 1)

    markers.push({
      ...marker,
      position: pos,
      label: marker.label ?? MARKER_LABELS[marker.kind] ?? '?',
    })
  }

  const pickupSegment = findSegment(route?.segments, 'current_to_pickup')
  const pickupPoint = segmentEndpoint(pickupSegment, 'end')
  const pickupIdx = pickupPoint ? nearestIndex(positions, pickupPoint) : 0

  const stopList = Array.isArray(stops) ? stops : []

  if (positions.length > 0) {
    placeMarker({
      id: 'current',
      kind: 'current',
      label: MARKER_LABELS.current,
      position: positions[0],
    })
  }

  stopList.forEach((stop, index) => {
    const type = (stop?.type ?? 'stop').toLowerCase()
    const position =
      getStopCoordinates(stop) ??
      estimateStopPosition(positions, pickupIdx, stop, stopList)

    if (!position) return

    placeMarker({
      id: `stop-${type}-${index}`,
      kind: type,
      label: MARKER_LABELS[type] ?? type.charAt(0).toUpperCase(),
      position,
      stop,
    })
  })

  if (stopList.length === 0 && positions.length > 1) {
    if (pickupPoint) {
      placeMarker({
        id: 'pickup-fallback',
        kind: 'pickup',
        label: MARKER_LABELS.pickup,
        position: pickupPoint,
      })
    }
    placeMarker({
      id: 'dropoff-fallback',
      kind: 'dropoff',
      label: MARKER_LABELS.dropoff,
      position: positions[positions.length - 1],
    })
  }

  return { markers, positions }
}

/** Lat/lng points for map.fitBounds — route polyline plus all marker positions */
export function collectFitBoundsPoints(positions, markers) {
  const points = [...(positions ?? [])]
  for (const marker of markers ?? []) {
    if (Array.isArray(marker?.position) && marker.position.length >= 2) {
      points.push(marker.position)
    }
  }
  return points
}
