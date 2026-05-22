/**
 * Turn Axios / DRF error payloads into a single user-facing string.
 */
export function parseApiError(error) {
  if (!error?.response) {
    if (error?.code === 'ERR_NETWORK') {
      return 'Unable to reach the server. Check that the backend is running and VITE_API_BASE_URL is correct.'
    }
    return error?.message || 'An unexpected error occurred. Please try again.'
  }

  const { data, status } = error.response

  if (typeof data === 'string' && data.trim()) {
    return data
  }

  if (data?.error) {
    const details = formatDetails(data.details)
    return details ? `${data.error} ${details}` : data.error
  }

  if (data && typeof data === 'object') {
    const fieldMessages = formatFieldErrors(data)
    if (fieldMessages) return fieldMessages
  }

  if (status === 400) return 'Invalid trip details. Please check your inputs and try again.'
  if (status >= 500) return 'Server error while planning the trip. Please try again later.'

  return 'Unable to plan the trip. Please try again.'
}

function formatFieldErrors(data) {
  const lines = []

  for (const [field, value] of Object.entries(data)) {
    if (field === 'non_field_errors' || field === 'detail') {
      const msg = normalizeMessage(value)
      if (msg) lines.push(msg)
      continue
    }
    const msg = normalizeMessage(value)
    if (msg) lines.push(`${humanizeField(field)}: ${msg}`)
  }

  return lines.length ? lines.join(' ') : null
}

function formatDetails(details) {
  if (!details || typeof details !== 'object') return ''
  const inner = formatFieldErrors(details)
  return inner ? `(${inner})` : ''
}

function normalizeMessage(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(' ')
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') return JSON.stringify(value)
  return ''
}

function humanizeField(field) {
  return field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
