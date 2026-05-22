import { useState } from 'react'
import {
  Coffee,
  Flag,
  Fuel,
  MapPin,
  Moon,
  Navigation,
  Package,
  PackageCheck,
  RefreshCw,
  Truck,
} from 'lucide-react'
import Card from '../common/Card'
import EmptyState from '../common/EmptyState'
import StatusBadge from '../common/StatusBadge'
import { metaLabel } from '../common/uiClasses'
import {
  formatHours,
  formatMiles,
  formatDateTimeRange,
} from '../../utils/formatters'
import {
  buildRouteInstructions,
  instructionMeta,
  titleCaseStatus,
  titleCaseType,
} from '../../utils/routeInstructions'

const INSTRUCTION_ICONS = {
  depart: MapPin,
  driving: Truck,
  current_to_pickup: Truck,
  pickup_to_dropoff: Truck,
  pickup: Package,
  dropoff: PackageCheck,
  fuel: Fuel,
  rest: Moon,
  break: Coffee,
  restart: RefreshCw,
  summary: Flag,
}

const ICON_RING_CLASS = {
  primary: 'bg-blue-100 text-blue-700 ring-blue-200/80',
  pickup: 'bg-emerald-100 text-emerald-700 ring-emerald-200/80',
  dropoff: 'bg-red-100 text-red-700 ring-red-200/80',
  fuel: 'bg-amber-100 text-amber-800 ring-amber-200/80',
  rest: 'bg-purple-100 text-purple-700 ring-purple-200/80',
  restart: 'bg-slate-200 text-slate-800 ring-slate-300/80',
  driving: 'bg-blue-100 text-blue-700 ring-blue-200/80',
  offDuty: 'bg-slate-100 text-slate-600 ring-slate-200/80',
  onDuty: 'bg-amber-100 text-amber-900 ring-amber-200/80',
  sleeper: 'bg-indigo-100 text-indigo-800 ring-indigo-200/80',
  success: 'bg-emerald-100 text-emerald-700 ring-emerald-200/80',
  default: 'bg-slate-100 text-slate-600 ring-slate-200/80',
}

/** Map HOS / stop status strings to badge variant (display only) */
function hosStatusMeta(status, statusDisplay) {
  if (statusDisplay) {
    return { variant: 'default', label: statusDisplay }
  }
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

const ADDRESS_EXPAND_THRESHOLD = 72

function InstructionAddress({ text, className = '' }) {
  const [expanded, setExpanded] = useState(false)

  if (!text) return null

  const canExpand = text.length > ADDRESS_EXPAND_THRESHOLD

  return (
    <div className={['min-w-0', className].join(' ')}>
      <p
        dir="auto"
        title={text}
        lang="und"
        className={[
          'text-sm leading-relaxed text-slate-700',
          'overflow-hidden break-words [overflow-wrap:anywhere]',
          !expanded && canExpand && 'line-clamp-2',
        ].join(' ')}
      >
        {text}
      </p>
      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="mt-1.5 text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          {expanded ? 'Show less' : 'Show full address'}
        </button>
      )}
    </div>
  )
}

function RouteEndpoints({ from, to }) {
  if (!from && !to) return null
  if (from === to) return null

  const full = `${from} → ${to}`

  return (
    <div
      className="mt-2 min-w-0 rounded-lg border border-slate-200/80 bg-white/60 px-3 py-2"
      title={full}
      dir="auto"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Route</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-600 [overflow-wrap:anywhere] break-words">
        <span className="font-medium text-slate-800">{from}</span>
        <span className="mx-1.5 shrink-0 text-slate-400" aria-hidden>
          →
        </span>
        <span className="font-medium text-slate-800">{to}</span>
      </p>
    </div>
  )
}

function TripSummaryDetails({ item }) {
  const stats = item.summaryStats
  if (!stats) return null

  const pickup = item.pickupLocationShort || item.pickupLocation
  const destination = item.locationShort || item.location

  return (
    <dl className="flex flex-nowrap items-start gap-x-10 overflow-x-auto border-t border-slate-200/60 pt-3 text-sm [-webkit-overflow-scrolling:touch]">
      {pickup && (
        <div className="min-w-0 shrink-0">
          <dt className={metaLabel}>Pickup</dt>
          <dd className="mt-0.5 font-medium text-slate-800" title={item.pickupLocation}>
            {pickup}
          </dd>
        </div>
      )}
      {destination && (
        <div className="min-w-0 shrink-0">
          <dt className={metaLabel}>Destination</dt>
          <dd className="mt-0.5 font-medium text-slate-800" title={item.location}>
            {destination}
          </dd>
        </div>
      )}
      <div className="shrink-0">
        <dt className={metaLabel}>Total distance</dt>
        <dd className="mt-0.5 font-medium text-slate-800">
          {formatMiles(stats.totalMiles)}
        </dd>
      </div>
      <div className="shrink-0">
        <dt className={metaLabel}>Driving</dt>
        <dd className="mt-0.5 font-medium text-slate-800">
          {formatHours(stats.drivingHours)}
        </dd>
      </div>
      <div className="shrink-0">
        <dt className={metaLabel}>On duty</dt>
        <dd className="mt-0.5 font-medium text-slate-800">
          {formatHours(stats.onDutyHours)}
        </dd>
      </div>
    </dl>
  )
}

function InstructionBadges({ item, meta }) {
  const hos = hosStatusMeta(item.status, item.statusDisplay)
  const typeLabel = titleCaseType(item.type)

  return (
    <div className="flex w-full shrink-0 flex-wrap items-center gap-1.5 sm:w-auto sm:max-w-[14rem] sm:flex-col sm:items-stretch lg:max-w-none lg:flex-row lg:items-center">
      <StatusBadge variant={meta.variant} className="w-full justify-center sm:w-auto sm:min-w-[7.5rem]">
        {typeLabel}
      </StatusBadge>
      {hos && (
        <StatusBadge
          variant={hos.variant}
          className="w-full justify-center sm:w-auto sm:min-w-[7.5rem]"
        >
          {hos.label}
        </StatusBadge>
      )}
    </div>
  )
}

function InstructionItem({ item }) {
  const meta = instructionMeta(item.type)
  const Icon = INSTRUCTION_ICONS[item.type] ?? Truck
  const iconRing = ICON_RING_CLASS[meta.variant] ?? ICON_RING_CLASS.default
  const titleId = `instruction-${item.step}-title`

  return (
    <li
      aria-labelledby={titleId}
      className={[
        'flex gap-3 rounded-xl border p-4 shadow-sm sm:gap-4 sm:p-5',
        meta.accent,
        item.isSummary ? 'font-medium' : '',
      ].join(' ')}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-800 shadow-sm ring-1 ring-slate-200/80 sm:h-10 sm:w-10"
        aria-hidden
      >
        {item.step}
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-2.5">
            <span
              className={[
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1',
                iconRing,
              ].join(' ')}
              aria-hidden
            >
              <Icon className="h-4 w-4" />
            </span>
            <h4
              id={titleId}
              className="min-w-0 pt-0.5 text-sm font-semibold leading-snug text-slate-900 sm:text-base"
            >
              {item.title}
            </h4>
          </div>
          <InstructionBadges item={item} meta={meta} />
        </div>

        {item.isSummary && item.summaryStats ? (
          <TripSummaryDetails item={item} />
        ) : (
          <>
            {item.location && <InstructionAddress text={item.location} />}

            {(item.from || item.to) && <RouteEndpoints from={item.from} to={item.to} />}

            {item.remark && (
              <p
                dir="auto"
                className="text-sm leading-relaxed text-slate-600 [overflow-wrap:anywhere] break-words"
              >
                {item.remark}
              </p>
            )}
          </>
        )}

        {!item.isSummary && (
        <dl className="border-t border-slate-200/60 pt-3 text-sm">
          <div className="flex flex-wrap items-start gap-x-10 gap-y-4">
            {item.distance_miles != null && Number(item.distance_miles) > 0 && (
              <div className="shrink-0">
                <dt className={metaLabel}>Distance</dt>
                <dd className="mt-0.5 font-medium text-slate-800">
                  {formatMiles(item.distance_miles)}
                </dd>
              </div>
            )}
            {(item.duration_hours != null && Number(item.duration_hours) > 0) ||
            item.schedule ? (
              <div className="flex min-w-0 flex-1 flex-nowrap items-start gap-x-10 overflow-x-auto [-webkit-overflow-scrolling:touch]">
                {item.duration_hours != null && Number(item.duration_hours) > 0 && (
                  <div className="shrink-0">
                    <dt className={metaLabel}>Duration</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">
                      {formatHours(item.duration_hours)}
                    </dd>
                  </div>
                )}
                {item.schedule && (
                  <div className="min-w-0 shrink-0">
                    <dt className={metaLabel}>Schedule</dt>
                    <dd className="mt-0.5 font-medium whitespace-nowrap text-slate-800">
                      {formatDateTimeRange(item.schedule.start, item.schedule.end)}
                    </dd>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </dl>
        )}
      </div>
    </li>
  )
}

export default function RouteInstructions({ route, stops, summary }) {
  const instructions = buildRouteInstructions(route, stops, summary)

  return (
    <Card
      title="Route Instructions"
      description="Step-by-step directions for this planned trip"
    >
      {instructions.length > 0 ? (
        <ol
          className="list-none space-y-3 p-0 sm:space-y-4"
          aria-label="Route instruction steps"
        >
          {instructions.map((item) => (
            <InstructionItem key={`${item.step}-${item.type}`} item={item} />
          ))}
        </ol>
      ) : (
        <EmptyState icon={Navigation} title="No route instructions available">
          Plan a trip to generate driving legs and stop-by-stop guidance.
        </EmptyState>
      )}
    </Card>
  )
}
