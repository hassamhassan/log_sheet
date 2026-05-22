/** Minutes in a 24-hour log day */
export const MINUTES_PER_DAY = 1440

export const STATUS_ROWS = [
  { key: 'off_duty', label: 'Off Duty' },
  { key: 'sleeper_berth', label: 'Sleeper Berth' },
  { key: 'driving', label: 'Driving' },
  { key: 'on_duty_not_driving', label: 'On Duty Not Driving' },
]

export const LAYOUT = {
  labelWidth: 184,
  gridWidth: 828,
  totalsWidth: 156,
  totalsGap: 18,
  rowHeight: 58,
  hourBandTop: 26,
  hourBandHeight: 76,
  gridTopGap: 16,
  /** Gap between status-hour cells and the day-total box */
  totalsDayTotalGap: 12,
  paddingX: 28,
  paddingY: 24,
  /** Inset inside grid so duty lines and hour labels do not touch borders */
  gridInset: 12,
  totalsValuePadX: 14,
  /** Inset for day-total box so it spans the totals column (outer panel width) */
  totalsColumnInset: 2,
  /** Rounded corners on graph panels and cells */
  boxRadius: 8,
  cellGap: 4,
}

export function statusToRow(status) {
  const index = STATUS_ROWS.findIndex((row) => row.key === status)
  return index >= 0 ? index : 0
}

export function minutesToX(
  minutes,
  gridLeft = LAYOUT.labelWidth,
  gridWidth = LAYOUT.gridWidth,
  gridInset = 0,
) {
  const clamped = Math.min(MINUTES_PER_DAY, Math.max(0, Number(minutes) || 0))
  const plotWidth = Math.max(0, gridWidth - gridInset * 2)
  return gridLeft + gridInset + (clamped / MINUTES_PER_DAY) * plotWidth
}

export function rowCenterY(rowIndex, graphTop, rowHeight = LAYOUT.rowHeight) {
  return graphTop + rowIndex * rowHeight + rowHeight / 2
}

export function hourLabel(hour) {
  if (hour === 0) return 'Midnight'
  if (hour === 12) return 'Noon'
  return String(hour)
}

/** Whole numbers without decimals; decimals up to 2 places (e.g. 14.71, 1.5). */
export function formatLogHours(value) {
  if (value == null || Number.isNaN(Number(value))) return '0'
  const rounded = Math.round(Number(value) * 100) / 100
  if (Number.isInteger(rounded)) return String(rounded)
  return String(Number(rounded.toFixed(2)))
}

/** @deprecated Use formatLogHours — kept for existing imports */
export function formatTotalHours(value) {
  return formatLogHours(value)
}

/** Build remark lines from events when log.remarks is absent */
export function buildRemarkLines(log) {
  if (Array.isArray(log?.remarks) && log.remarks.length > 0) {
    return log.remarks.filter((line) => line && String(line).trim())
  }

  if (!Array.isArray(log?.events)) return []

  return log.events
    .filter((event) => event?.remark && String(event.remark).trim())
    .map((event) => {
      const time = event.start_time ?? '00:00'
      return `${time} - ${event.remark.trim()}`
    })
}

export function buildGraphSegments(events, gridInset = LAYOUT.gridInset) {
  if (!Array.isArray(events) || events.length === 0) return { horizontals: [], verticals: [] }

  const sorted = [...events].sort(
    (a, b) => (a.start_minutes ?? 0) - (b.start_minutes ?? 0),
  )

  const horizontals = sorted.map((event) => ({
    status: event.status,
    row: statusToRow(event.status),
    x1: minutesToX(event.start_minutes, LAYOUT.labelWidth, LAYOUT.gridWidth, gridInset),
    x2: minutesToX(
      event.end_minutes ?? MINUTES_PER_DAY,
      LAYOUT.labelWidth,
      LAYOUT.gridWidth,
      gridInset,
    ),
  }))

  const verticals = []
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const current = sorted[i]
    const next = sorted[i + 1]
    if (current.status === next.status) continue

    const x = minutesToX(
      next.start_minutes ?? current.end_minutes,
      LAYOUT.labelWidth,
      LAYOUT.gridWidth,
      gridInset,
    )
    verticals.push({
      x,
      row1: statusToRow(current.status),
      row2: statusToRow(next.status),
    })
  }

  return { horizontals, verticals }
}

/** Height of each totals value box (status rows and day total). */
export function getTotalsValueBoxHeight() {
  return LAYOUT.rowHeight - LAYOUT.cellGap
}

/** Vertical center of the hour-label band (grey header row). */
export function hourBandCenterY(graphTop, hourBandTop = LAYOUT.hourBandTop) {
  return hourBandTop + (graphTop - hourBandTop) / 2
}

export function getSheetDimensions() {
  const graphTop = LAYOUT.hourBandHeight + LAYOUT.gridTopGap
  const graphHeight = STATUS_ROWS.length * LAYOUT.rowHeight
  const totalsValueBoxHeight = getTotalsValueBoxHeight()
  const width =
    LAYOUT.paddingX * 2 +
    LAYOUT.labelWidth +
    LAYOUT.gridWidth +
    LAYOUT.totalsGap +
    LAYOUT.totalsWidth
  const height =
    graphTop +
    graphHeight +
    LAYOUT.totalsDayTotalGap +
    totalsValueBoxHeight +
    LAYOUT.paddingY

  return { width, height, graphTop, graphHeight }
}
