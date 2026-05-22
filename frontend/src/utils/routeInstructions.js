import { formatShortLocation, titleCaseStatus, titleCaseType } from './formatters'

function segmentInstruction(segment, step, title) {
  return {
    step,
    type: segment?.type ?? 'driving',
    title,
    location: segment?.to_location ?? segment?.from_location,
    from: segment?.from_location,
    to: segment?.to_location,
    distance_miles: segment?.distance_miles,
    duration_hours: segment?.duration_hours,
    status: 'driving',
    remark: `Drive from ${segment?.from_location ?? 'origin'} to ${segment?.to_location ?? 'destination'}`,
  }
}

function stopInstruction(stop, step, titleOverride) {
  const type = stop?.type ?? 'stop'
  const titles = {
    pickup: 'Pickup stop — 1 hour on duty',
    dropoff: 'Dropoff stop — 1 hour on duty',
    fuel: 'Fuel stop',
    rest: '10-hour off-duty rest',
    break: '30-minute break',
    restart: '34-hour cycle restart',
  }

  return {
    step,
    type,
    title: titleOverride ?? titles[type] ?? titleCaseType(type),
    location: stop?.location,
    remark: stop?.remark,
    duration_hours: stop?.duration_hours,
    distance_miles: stop?.distance_miles,
    status: stop?.status,
    schedule: stop?.start_datetime && stop?.end_datetime
      ? { start: stop.start_datetime, end: stop.end_datetime }
      : null,
  }
}

/**
 * Build ordered route instructions from API route segments and stops.
 */
export function buildRouteInstructions(route, stops, summary) {
  const instructions = []
  let step = 1

  const segments = Array.isArray(route?.segments) ? route.segments : []
  const stopList = Array.isArray(stops)
    ? [...stops].sort(
        (a, b) =>
          new Date(a.start_datetime ?? 0).getTime() -
          new Date(b.start_datetime ?? 0).getTime(),
      )
    : []

  const toPickup = segments.find((s) => s.type === 'current_to_pickup')
  const toDropoff = segments.find((s) => s.type === 'pickup_to_dropoff')
  const pickupStop = stopList.find((s) => s.type === 'pickup')
  const dropoffStop = stopList.find((s) => s.type === 'dropoff')
  const enRouteStops = stopList.filter(
    (s) => !['pickup', 'dropoff'].includes(s.type),
  )

  const startLocation = toPickup?.from_location ?? segments[0]?.from_location
  if (startLocation) {
    instructions.push({
      step: step++,
      type: 'depart',
      title: 'Start from current location',
      location: startLocation,
      remark: 'Begin trip at current location',
      statusDisplay: 'Starting Point',
    })
  }

  if (toPickup) {
    instructions.push(segmentInstruction(toPickup, step++, 'Drive to pickup'))
  }

  if (pickupStop) {
    instructions.push(stopInstruction(pickupStop, step++))
  }

  if (toDropoff) {
    instructions.push(
      segmentInstruction(toDropoff, step++, 'Continue toward dropoff'),
    )
  }

  for (const stop of enRouteStops) {
    instructions.push(stopInstruction(stop, step++))
  }

  if (dropoffStop) {
    instructions.push(stopInstruction(dropoffStop, step++))
  }

  if (summary && instructions.length > 0) {
    const pickup = pickupStop?.location ?? toPickup?.to_location
    const destination = dropoffStop?.location ?? toDropoff?.to_location
    instructions.push({
      step,
      type: 'summary',
      title: 'Trip complete',
      location: destination,
      locationShort: formatShortLocation(destination),
      pickupLocation: pickup,
      pickupLocationShort: formatShortLocation(pickup),
      summaryStats: {
        totalMiles: summary.total_miles,
        drivingHours: summary.total_driving_hours,
        onDutyHours: summary.total_on_duty_hours,
      },
      status: null,
      isSummary: true,
    })
  }

  return instructions
}

export function instructionMeta(type) {
  const map = {
    depart: { variant: 'primary', accent: 'border-blue-200 bg-blue-50' },
    driving: { variant: 'primary', accent: 'border-blue-200 bg-blue-50' },
    current_to_pickup: { variant: 'primary', accent: 'border-blue-200 bg-blue-50' },
    pickup_to_dropoff: { variant: 'primary', accent: 'border-blue-200 bg-blue-50' },
    pickup: { variant: 'pickup', accent: 'border-emerald-200 bg-emerald-50' },
    dropoff: { variant: 'dropoff', accent: 'border-red-200 bg-red-50' },
    fuel: { variant: 'fuel', accent: 'border-amber-200 bg-amber-50' },
    rest: { variant: 'rest', accent: 'border-purple-200 bg-purple-50' },
    break: { variant: 'primary', accent: 'border-blue-200 bg-blue-50' },
    restart: { variant: 'restart', accent: 'border-slate-300 bg-slate-100' },
    summary: { variant: 'success', accent: 'border-emerald-200 bg-emerald-50/80' },
  }
  return map[type] ?? { variant: 'default', accent: 'border-slate-200 bg-slate-50' }
}

export { titleCaseStatus, titleCaseType }
