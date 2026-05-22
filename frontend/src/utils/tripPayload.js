import dayjs from 'dayjs'

export const SAMPLE_TRIP = {
  current_location: 'Dallas, TX',
  pickup_location: 'Houston, TX',
  dropoff_location: 'Atlanta, GA',
  current_cycle_used_hours: 20,
  start_datetime: '2026-05-21T08:00:00Z',
  driver_name: 'John Driver',
  carrier_name: 'Demo Carrier',
  main_office_address: 'Dallas, TX',
  vehicle_number: 'TRK-100',
  trailer_number: 'TRL-900',
  shipping_document: 'BOL-12345',
}

const INVALID_LOCATION_VALUES = new Set([
  'string',
  'test',
  'location',
  'null',
  'undefined',
  'none',
  'n/a',
  'na',
])

const PLACEHOLDER_MESSAGE =
  'Please enter a real city/address, not a placeholder value.'

export function validateLocation(value) {
  const cleaned = (value ?? '').trim()
  if (!cleaned) return 'Location is required.'
  if (cleaned.length < 3) return PLACEHOLDER_MESSAGE
  if (INVALID_LOCATION_VALUES.has(cleaned.toLowerCase())) return PLACEHOLDER_MESSAGE
  return true
}

/** Map API/sample ISO datetime to datetime-local input value */
export function toDatetimeLocalValue(isoOrLocal) {
  if (!isoOrLocal) return ''
  return dayjs(isoOrLocal).format('YYYY-MM-DDTHH:mm')
}

/** Convert form values to POST /api/trips/plan/ payload */
export function buildTripPlanPayload(formValues) {
  const optionalStrings = [
    'driver_name',
    'carrier_name',
    'main_office_address',
    'vehicle_number',
    'trailer_number',
    'shipping_document',
  ]

  const payload = {
    current_location: formValues.current_location.trim(),
    pickup_location: formValues.pickup_location.trim(),
    dropoff_location: formValues.dropoff_location.trim(),
    current_cycle_used_hours: Number(formValues.current_cycle_used_hours),
    start_datetime: toApiDatetime(formValues.start_datetime),
  }

  for (const key of optionalStrings) {
    const val = (formValues[key] ?? '').trim()
    if (val) payload[key] = val
  }

  return payload
}

function toApiDatetime(value) {
  if (!value) return value
  if (value.includes('Z') || /[+-]\d{2}:\d{2}$/.test(value)) {
    return dayjs(value).toISOString()
  }
  return dayjs(value).toISOString()
}

export function sampleTripFormValues() {
  return {
    ...SAMPLE_TRIP,
    start_datetime: toDatetimeLocalValue(SAMPLE_TRIP.start_datetime),
  }
}

export function defaultTripFormValues() {
  return {
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    current_cycle_used_hours: 0,
    start_datetime: dayjs().format('YYYY-MM-DDTHH:mm'),
    driver_name: '',
    carrier_name: '',
    main_office_address: '',
    vehicle_number: '',
    trailer_number: '',
    shipping_document: '',
  }
}
