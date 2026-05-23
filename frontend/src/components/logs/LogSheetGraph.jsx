import {
  LAYOUT,
  MINUTES_PER_DAY,
  STATUS_ROWS,
  buildGraphSegments,
  formatLogHours,
  getSheetDimensions,
  getTotalsValueBoxHeight,
  hourBandCenterY,
  hourLabel,
  minutesToX,
  rowCenterY,
} from '../../utils/logSheetUtils'

const GRID_INSET = LAYOUT.gridInset
const LABEL_TEXT_X = 22
const VALUE_PAD_X = LAYOUT.totalsValuePadX
const BOX_RADIUS = LAYOUT.boxRadius
const CELL_GAP = LAYOUT.cellGap

function RoundedRect({
  x,
  y,
  width,
  height,
  fill,
  stroke,
  strokeWidth = 1,
  rx = BOX_RADIUS,
}) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={rx}
      ry={rx}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  )
}

function shouldShowHourLabel(hour) {
  return hour === 0 || hour === 24 || hour % 3 === 0
}

function hourLabelPosition(hour, gridLeft) {
  const plotLeft = minutesToX(0, gridLeft, LAYOUT.gridWidth, GRID_INSET)
  const plotRight = minutesToX(MINUTES_PER_DAY, gridLeft, LAYOUT.gridWidth, GRID_INSET)

  if (hour === 0) {
    return { x: plotLeft + 6, textAnchor: 'start' }
  }
  if (hour === 24) {
    return { x: plotRight - 6, textAnchor: 'end' }
  }

  const x = minutesToX(hour * 60, gridLeft, LAYOUT.gridWidth, GRID_INSET)
  const minX = plotLeft + 20
  const maxX = plotRight - 20
  const clampedX = Math.min(maxX, Math.max(minX, x))
  return { x: clampedX, textAnchor: 'middle' }
}

function HourLabels({ centerY, gridLeft }) {
  const labels = []

  for (let hour = 0; hour <= 24; hour += 1) {
    if (!shouldShowHourLabel(hour)) continue

    const isMajor = hour === 0 || hour === 12 || hour === 24
    const { x, textAnchor } = hourLabelPosition(hour, gridLeft)

    labels.push(
      <text
        key={`label-${hour}`}
        x={x}
        y={centerY}
        textAnchor={textAnchor}
        dominantBaseline="middle"
        fill={hour === 24 ? '#64748b' : '#475569'}
        fontSize={isMajor ? 11 : 10}
        fontWeight={isMajor ? 700 : 500}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {hour === 24 ? '24' : hourLabel(hour)}
      </text>,
    )
  }

  return labels
}

function HourGridLines({ gridTop, graphHeight, gridLeft }) {
  const lines = []
  for (let hour = 0; hour < 24; hour += 1) {
    const x = minutesToX(hour * 60, gridLeft, LAYOUT.gridWidth, GRID_INSET)
    const isMajor = hour % 3 === 0
    lines.push(
      <line
        key={`tick-${hour}`}
        x1={x}
        y1={gridTop}
        x2={x}
        y2={gridTop + graphHeight}
        stroke={isMajor ? '#cbd5e1' : '#e8edf2'}
        strokeWidth={isMajor ? 1 : 0.5}
      />,
    )
  }
  return lines
}

function StatusLabel({ row, centerY }) {
  const multiLine =
    row.key === 'on_duty_not_driving'
      ? ['On Duty', 'Not Driving']
      : row.key === 'sleeper_berth'
        ? ['Sleeper', 'Berth']
        : null

  if (!multiLine) {
    return (
      <text
        x={LABEL_TEXT_X}
        y={centerY}
        dominantBaseline="middle"
        fontSize={12.5}
        fontWeight={700}
        fill="#0f172a"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {row.label}
      </text>
    )
  }

  return (
    <text
      x={LABEL_TEXT_X}
      y={centerY}
      dominantBaseline="middle"
      fill="#0f172a"
      fontFamily="ui-sans-serif, system-ui, sans-serif"
    >
      <tspan x={LABEL_TEXT_X} dy="-0.55em" fontSize={11.5} fontWeight={700}>
        {multiLine[0]}
      </tspan>
      <tspan x={LABEL_TEXT_X} dy="1.15em" fontSize={11.5} fontWeight={700}>
        {multiLine[1]}
      </tspan>
    </text>
  )
}

function TotalsValue({
  x,
  y,
  width,
  height,
  centerY,
  children,
  fill = '#fff',
  variant = 'status',
}) {
  const isDayTotal = variant === 'dayTotal'
  return (
    <g>
      <RoundedRect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={isDayTotal ? '#fff' : fill}
        stroke={isDayTotal ? '#64748b' : '#e2e8f0'}
        strokeWidth={isDayTotal ? 1.5 : 0.75}
        rx={BOX_RADIUS}
      />
      <text
        x={x + width / 2}
        y={centerY}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={12.5}
        fontWeight={700}
        fill="#0f172a"
        fontFamily="ui-monospace, ui-sans-serif, monospace"
      >
        {children}
      </text>
    </g>
  )
}

export default function LogSheetGraph({ log }) {
  const totals = log?.totals ?? {}
  const { horizontals, verticals } = buildGraphSegments(log?.events, GRID_INSET)
  const { width, height, graphTop, graphHeight } = getSheetDimensions()
  const statusValueBoxH = getTotalsValueBoxHeight()
  const gridLeft = LAYOUT.labelWidth
  const gridRight = gridLeft + LAYOUT.gridWidth
  const totalsLeft = gridRight + LAYOUT.totalsGap
  const totalsCenter = totalsLeft + LAYOUT.totalsWidth / 2
  const totalsBodyBottom = graphTop + graphHeight
  const dayTotalBoxY = totalsBodyBottom + LAYOUT.totalsDayTotalGap
  const dayTotalBoxH = statusValueBoxH
  const hourBandTop = LAYOUT.hourBandTop
  const hourBandMidY = hourBandCenterY(graphTop, hourBandTop)
  const plotLeft = minutesToX(0, gridLeft, LAYOUT.gridWidth, GRID_INSET)
  const plotRight = minutesToX(MINUTES_PER_DAY, gridLeft, LAYOUT.gridWidth, GRID_INSET)
  const valueBoxX = totalsLeft + VALUE_PAD_X
  const valueBoxW = LAYOUT.totalsWidth - VALUE_PAD_X * 2
  const dayTotalBoxX = totalsLeft + LAYOUT.totalsColumnInset
  const dayTotalBoxW = LAYOUT.totalsWidth - LAYOUT.totalsColumnInset * 2
  const totalsColumnBottom = dayTotalBoxY + dayTotalBoxH

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMinYMin meet"
      className="log-sheet-graph-svg block w-full max-w-none"
      role="img"
      aria-label={`24-hour duty status graph for ${log?.date ?? 'log day'}`}
    >
      <rect x={0} y={0} width={width} height={height} fill="#fff" />

      <text
        x={gridLeft + LAYOUT.gridWidth / 2}
        y={hourBandTop - 6}
        textAnchor="middle"
        fill="#0f172a"
        fontSize={11}
        fontWeight={700}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        Hours
      </text>

      <RoundedRect
        x={gridLeft}
        y={hourBandTop}
        width={LAYOUT.gridWidth}
        height={graphTop - hourBandTop}
        fill="#f1f5f9"
        stroke="#94a3b8"
        strokeWidth={0.5}
      />

      {/* Totals column — status hours only */}
      <RoundedRect
        x={totalsLeft}
        y={hourBandTop}
        width={LAYOUT.totalsWidth}
        height={totalsBodyBottom - hourBandTop + 4}
        fill="#eef2f6"
        stroke="#94a3b8"
        strokeWidth={0.75}
      />

      <HourLabels centerY={hourBandMidY} gridLeft={gridLeft} />
      <HourGridLines gridTop={graphTop} graphHeight={graphHeight} gridLeft={gridLeft} />

      <text
        x={totalsCenter}
        y={hourBandMidY}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#334155"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        <tspan x={totalsCenter} dy="-0.55em" fontSize={10} fontWeight={800}>
          TOTAL
        </tspan>
        <tspan x={totalsCenter} dy="1.15em" fontSize={9} fontWeight={600} fill="#64748b">
          HRS
        </tspan>
      </text>

      {STATUS_ROWS.map((row, index) => {
        const y = graphTop + index * LAYOUT.rowHeight
        const centerY = rowCenterY(index, graphTop)
        const labelW = gridLeft - 4 - CELL_GAP
        const cellY = y + CELL_GAP / 2
        const cellH = LAYOUT.rowHeight - CELL_GAP
        const valueY = y + CELL_GAP / 2
        const valueH = statusValueBoxH
        return (
          <g key={row.key}>
            <RoundedRect
              x={CELL_GAP / 2}
              y={cellY}
              width={labelW}
              height={cellH}
              fill={index % 2 === 0 ? '#f8fafc' : '#fff'}
              stroke="#e2e8f0"
              strokeWidth={0.5}
            />
            <StatusLabel row={row} centerY={centerY} />
            <line
              x1={gridLeft}
              y1={y + LAYOUT.rowHeight}
              x2={gridRight}
              y2={y + LAYOUT.rowHeight}
              stroke="#cbd5e1"
              strokeWidth={1}
            />
            <TotalsValue
              x={valueBoxX}
              y={valueY}
              width={valueBoxW}
              height={valueH}
              centerY={centerY}
              fill={index % 2 === 0 ? '#f8fafc' : '#fff'}
            >
              {formatLogHours(totals[row.key])}
            </TotalsValue>
          </g>
        )
      })}

      <line
        x1={totalsLeft + LAYOUT.totalsColumnInset}
        y1={dayTotalBoxY - LAYOUT.totalsDayTotalGap / 2}
        x2={totalsLeft + LAYOUT.totalsWidth - LAYOUT.totalsColumnInset}
        y2={dayTotalBoxY - LAYOUT.totalsDayTotalGap / 2}
        stroke="#cbd5e1"
        strokeWidth={1}
      />
      <TotalsValue
        x={dayTotalBoxX}
        y={dayTotalBoxY}
        width={dayTotalBoxW}
        height={dayTotalBoxH}
        centerY={dayTotalBoxY + dayTotalBoxH / 2}
        variant="dayTotal"
      >
        {formatLogHours(totals.total ?? 24)}
      </TotalsValue>

      <RoundedRect
        x={gridLeft}
        y={graphTop}
        width={LAYOUT.gridWidth}
        height={graphHeight}
        fill="none"
        stroke="#334155"
        strokeWidth={2}
      />

      <line
        x1={plotLeft}
        y1={graphTop}
        x2={plotLeft}
        y2={totalsBodyBottom}
        stroke="#64748b"
        strokeWidth={1.5}
      />
      <line
        x1={plotRight}
        y1={graphTop}
        x2={plotRight}
        y2={totalsBodyBottom}
        stroke="#64748b"
        strokeWidth={1.5}
      />

      {verticals.map((segment, index) => (
        <line
          key={`v-${index}`}
          x1={segment.x}
          y1={rowCenterY(segment.row1, graphTop)}
          x2={segment.x}
          y2={rowCenterY(segment.row2, graphTop)}
          stroke="#0f172a"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      ))}

      {horizontals.map((segment, index) => (
        <line
          key={`h-${index}`}
          x1={segment.x1}
          y1={rowCenterY(segment.row, graphTop)}
          x2={segment.x2}
          y2={rowCenterY(segment.row, graphTop)}
          stroke="#0f172a"
          strokeWidth={3}
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}
