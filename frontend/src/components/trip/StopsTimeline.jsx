import { useState } from 'react'
import {
  CircleDot,
  Coffee,
  Fuel,
  Moon,
  Package,
  PackageCheck,
  RefreshCw,
} from 'lucide-react'
import Card from '../common/Card'
import EmptyState from '../common/EmptyState'
import StatusBadge from '../common/StatusBadge'
import { metaLabel } from '../common/uiClasses'
import { parseStopLocation } from '../../utils/locationDisplay'
import {
  formatDateTime,
  formatHours,
  titleCaseStatus,
  titleCaseType,
} from '../../utils/formatters'

const LOCATION_EXPAND_THRESHOLD = 80

const STOP_META = {
  pickup: {
    variant: 'pickup',
    icon: Package,
    node: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    panel: 'border-emerald-200 bg-white ring-emerald-100/80',
    durationBadge: 'bg-emerald-100 text-emerald-900 ring-emerald-300/90',
    iconRing: 'bg-emerald-100 text-emerald-700 ring-emerald-200/80',
  },
  dropoff: {
    variant: 'dropoff',
    icon: PackageCheck,
    node: 'bg-red-100 text-red-700 ring-red-200',
    panel: 'border-red-200 bg-white ring-red-100/80',
    durationBadge: 'bg-red-100 text-red-900 ring-red-300/90',
    iconRing: 'bg-red-100 text-red-700 ring-red-200/80',
  },
  fuel: {
    variant: 'fuel',
    icon: Fuel,
    node: 'bg-amber-100 text-amber-800 ring-amber-200',
    panel: 'border-amber-200 bg-white ring-amber-100/80',
    durationBadge: 'bg-amber-100 text-amber-950 ring-amber-300/90',
    iconRing: 'bg-amber-100 text-amber-800 ring-amber-200/80',
  },
  break: {
    variant: 'primary',
    icon: Coffee,
    node: 'bg-blue-100 text-blue-700 ring-blue-200',
    panel: 'border-blue-200 bg-blue-50/50 ring-blue-100/80',
    durationBadge: 'bg-blue-100 text-blue-900 ring-blue-300/90',
    iconRing: 'bg-blue-100 text-blue-700 ring-blue-200/80',
  },
  rest: {
    variant: 'rest',
    icon: Moon,
    node: 'bg-purple-100 text-purple-700 ring-purple-300',
    panel: 'border-purple-200 bg-purple-50/70 ring-purple-100/80',
    durationBadge: 'bg-purple-100 text-purple-950 ring-purple-300/90',
    iconRing: 'bg-purple-100 text-purple-700 ring-purple-200/80',
    emphasized: true,
  },
  restart: {
    variant: 'restart',
    icon: RefreshCw,
    node: 'bg-slate-800 text-white ring-slate-600',
    panel: 'border-slate-300 bg-slate-50 ring-slate-200/80',
    durationBadge: 'bg-slate-200 text-slate-900 ring-slate-400/90',
    iconRing: 'bg-slate-200 text-slate-800 ring-slate-300/80',
    emphasized: true,
  },
  default: {
    variant: 'default',
    icon: CircleDot,
    node: 'bg-slate-100 text-slate-600 ring-slate-200',
    panel: 'border-slate-200 bg-white ring-slate-100/80',
    durationBadge: 'bg-slate-100 text-slate-800 ring-slate-300/90',
    iconRing: 'bg-slate-100 text-slate-600 ring-slate-200/80',
  },
}

function resolveStopMeta(type) {
  const key = (type ?? '').toLowerCase()
  return STOP_META[key] ?? STOP_META.default
}

function hosStatusMeta(status) {
  const key = String(status ?? '')
    .toLowerCase()
    .replace(/\s+/g, '_')

  const map = {
    off_duty: { variant: 'offDuty', label: 'Off Duty' },
    driving: { variant: 'driving', label: 'Driving' },
    sleeper_berth: { variant: 'sleeper', label: 'Sleeper Berth' },
    on_duty_not_driving: { variant: 'onDuty', label: 'On Duty Not Driving' },
    on_duty: { variant: 'onDuty', label: 'On Duty' },
  }

  if (map[key]) return map[key]
  if (!status) return null
  return { variant: 'default', label: titleCaseStatus(status) }
}

function StopLocation({ location, className = '' }) {
  const [expanded, setExpanded] = useState(false)
  const { lines, raw } = parseStopLocation(location)

  if (!raw) return null

  const canExpand = raw.length > LOCATION_EXPAND_THRESHOLD
  const singleLine = lines.length === 1

  return (
    <div
      className={['stop-location min-w-0', className].join(' ')}
      data-i18n-ready="true"
      title={raw}
    >
      <p className={metaLabel}>Location</p>
      <div className="mt-1.5 space-y-1.5">
        {lines.map((line, index) => (
          <p
            key={`${line.locale}-${index}`}
            dir={line.dir}
            lang={line.locale}
            data-locale={line.locale}
            className={[
              'text-sm font-semibold leading-relaxed',
              'break-words [overflow-wrap:anywhere]',
              index > 0 ? 'text-slate-700' : 'text-slate-900',
              !expanded && canExpand && singleLine && 'line-clamp-2',
            ].join(' ')}
          >
            {line.text}
          </p>
        ))}
      </div>
      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="mt-1.5 text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          {expanded ? 'Show less' : 'Show full location'}
        </button>
      )}
    </div>
  )
}

function DurationBadge({ hours, className = '' }) {
  return (
    <span
      className={[
        'inline-flex min-w-[4.5rem] items-center justify-center rounded-lg px-3.5 py-2',
        'text-sm font-bold tabular-nums shadow-sm ring-2',
        className,
      ].join(' ')}
    >
      {formatHours(hours)}
    </span>
  )
}

function ScheduleField({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className={metaLabel}>{label}</dt>
      <dd className="mt-1 text-sm font-medium leading-snug text-slate-800">{value}</dd>
    </div>
  )
}

function StopItem({ stop, isLast }) {
  const type = stop?.type ?? ''
  const meta = resolveStopMeta(type)
  const Icon = meta.icon
  const emphasized = meta.emphasized
  const hos = hosStatusMeta(stop?.status)
  const nodeSize = emphasized ? 'h-10 w-10' : 'h-9 w-9'

  return (
    <li className="relative flex gap-3 pb-7 last:pb-0 sm:gap-4">
      {!isLast && (
        <span
          className="absolute left-[1.125rem] top-11 h-[calc(100%-2rem)] w-0.5 bg-slate-200 sm:left-[1.25rem]"
          aria-hidden
        />
      )}

      <div
        className={[
          'relative z-10 flex shrink-0 items-center justify-center rounded-full ring-2',
          nodeSize,
          meta.node,
        ].join(' ')}
      >
        <Icon className={emphasized ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden />
      </div>

      <article
        className={[
          'min-w-0 flex-1 rounded-xl border p-4 shadow-sm ring-1 sm:p-5',
          meta.panel,
        ].join(' ')}
        aria-label={`${titleCaseType(type)} stop${stop?.location ? `: ${stop.location}` : ''}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-2.5">
            <span
              className={[
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1',
                meta.iconRing,
              ].join(' ')}
              aria-hidden
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <StatusBadge variant={meta.variant} className="text-xs sm:min-w-[5.5rem] sm:justify-center">
                {titleCaseType(type)}
              </StatusBadge>
              {hos && (
                <StatusBadge variant={hos.variant} className="text-xs sm:min-w-[5.5rem] sm:justify-center">
                  {hos.label}
                </StatusBadge>
              )}
              {emphasized && (
                <span
                  className={[
                    'rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wide',
                    type === 'restart'
                      ? 'bg-slate-800 text-white'
                      : 'bg-purple-200 text-purple-900',
                  ].join(' ')}
                >
                  {type === 'restart' ? '34h restart' : '10h rest'}
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 sm:text-right">
            <p className={metaLabel}>Duration</p>
            <div className="mt-1.5">
              <DurationBadge hours={stop?.duration_hours} className={meta.durationBadge} />
            </div>
          </div>
        </div>

        {stop?.location && <StopLocation location={stop.location} className="mt-4" />}

        <dl className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-200/70 pt-4 sm:grid-cols-2">
          <ScheduleField
            label="Start"
            value={formatDateTime(stop?.start_datetime)}
          />
          <ScheduleField label="End" value={formatDateTime(stop?.end_datetime)} />
        </dl>

        {stop?.remark && (
          <div className="mt-4 border-t border-slate-200/70 pt-4">
            <p className={metaLabel}>Remark</p>
            <p
              dir="auto"
              lang="und"
              title={stop.remark}
              className="mt-1.5 text-sm leading-relaxed text-slate-600 [overflow-wrap:anywhere] break-words"
            >
              {stop.remark}
            </p>
          </div>
        )}
      </article>
    </li>
  )
}

export default function StopsTimeline({ stops }) {
  const items = Array.isArray(stops) ? stops : []

  return (
    <Card
      title="Stops & rests"
      description="Pickup, fuel, breaks, rest, cycle restart, and dropoff along your route"
    >
      {items.length > 0 ? (
        <ol className="list-none space-y-0 p-0" aria-label="Trip stops and rest breaks timeline">
          {items.map((stop, index) => (
            <StopItem
              key={`${stop?.type ?? 'stop'}-${stop?.start_datetime ?? index}-${index}`}
              stop={stop}
              isLast={index === items.length - 1}
            />
          ))}
        </ol>
      ) : (
        <EmptyState title="No stops scheduled">
          Stops will appear here after you plan a trip.
        </EmptyState>
      )}
    </Card>
  )
}
