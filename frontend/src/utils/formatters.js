import dayjs from 'dayjs'

export function formatMiles(miles) {
  if (miles == null || Number.isNaN(Number(miles))) return '—'
  return `${Number(miles).toLocaleString(undefined, { maximumFractionDigits: 1 })} mi`
}

export function formatHours(hours) {
  if (hours == null || Number.isNaN(Number(hours))) return '—'
  return `${Number(hours).toFixed(1)} hrs`
}

export function formatDateTime(value) {
  if (!value) return '—'
  const parsed = dayjs(value)
  if (!parsed.isValid()) return '—'
  return parsed.format('MMM D, YYYY h:mm A')
}

export function formatDate(value) {
  if (!value) return '—'
  const parsed = dayjs(value)
  if (!parsed.isValid()) return '—'
  return parsed.format('MMM D, YYYY')
}

export function formatDuration(minutes) {
  if (minutes == null || Number.isNaN(Number(minutes))) return '—'
  const hrs = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  if (hrs === 0) return `${mins}m`
  if (mins === 0) return `${hrs}h`
  return `${hrs}h ${mins}m`
}

export function titleCaseStatus(status) {
  if (status == null || status === '') return '—'
  return String(status)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function titleCaseType(type) {
  if (type == null || type === '') return 'Stop'
  return String(type)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function formatDateTimeRange(start, end) {
  if (!start && !end) return '—'
  if (start && end) {
    return `${formatDateTime(start)} → ${formatDateTime(end)}`
  }
  return formatDateTime(start || end)
}

/** Shorter label for geocoded addresses (City, County, State, Country). */
export function formatShortLocation(location) {
  if (!location) return ''
  const parts = String(location)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  const country = parts[parts.length - 1]
  if (parts.length >= 4) {
    const state = parts.find((part, index) => index > 0 && index < parts.length - 1 && !/county/i.test(part))
    const stateLabel = state ?? parts[parts.length - 2]
    return `${parts[0]}, ${stateLabel}, ${country}`
  }
  if (parts.length === 3) {
    return `${parts[0]}, ${parts[1]}, ${parts[2]}`
  }
  if (parts.length === 2) {
    return `${parts[0]}, ${parts[1]}`
  }
  return location
}
