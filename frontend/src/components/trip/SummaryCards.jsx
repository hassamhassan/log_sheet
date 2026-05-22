import {
  Battery,
  ClipboardList,
  Gauge,
  MapPinned,
  Route,
  Timer,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import Card from '../common/Card'
import EmptyState from '../common/EmptyState'
import StatusBadge from '../common/StatusBadge'
import {
  innerPanel,
  statHint,
  statLabel,
  statValue,
} from '../common/uiClasses'
import { formatHours, formatMiles } from '../../utils/formatters'

function StatCard({ label, value, icon: Icon, accent, hint }) {
  return (
    <div
      className={[
        innerPanel,
        'flex items-start gap-3 p-4 shadow-sm transition-shadow hover:shadow-md sm:gap-4 sm:p-5',
      ].join(' ')}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 sm:rounded-2xl ${accent}`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className={statLabel}>{label}</p>
        <p className={[statValue, 'break-words'].join(' ')}>{value}</p>
        {hint && <p className={statHint}>{hint}</p>}
      </div>
    </div>
  )
}

function buildStats(summary) {
  const estimated = Boolean(summary?.estimated)

  return [
    {
      key: 'miles',
      label: 'Total Miles',
      value: formatMiles(summary?.total_miles),
      icon: MapPinned,
      accent: 'bg-blue-50 text-blue-600',
    },
    {
      key: 'driving',
      label: 'Driving Hours',
      value: formatHours(summary?.total_driving_hours),
      icon: Gauge,
      accent: 'bg-emerald-50 text-emerald-600',
    },
    {
      key: 'onDuty',
      label: 'On-Duty Hours',
      value: formatHours(summary?.total_on_duty_hours),
      icon: Timer,
      accent: 'bg-amber-50 text-amber-700',
    },
    {
      key: 'initialCycle',
      label: 'Initial Cycle Used',
      value: formatHours(summary?.initial_cycle_used_hours),
      icon: TrendingUp,
      accent: 'bg-slate-100 text-slate-700',
    },
    {
      key: 'finalCycle',
      label: 'Final Cycle Used',
      value: formatHours(summary?.final_cycle_used_hours),
      icon: Battery,
      accent: 'bg-orange-50 text-orange-700',
    },
    {
      key: 'remainingCycle',
      label: 'Remaining Cycle',
      value: formatHours(summary?.remaining_cycle_hours),
      icon: TrendingDown,
      accent: 'bg-teal-50 text-teal-700',
    },
    {
      key: 'logSheets',
      label: 'Log Sheets',
      value:
        summary?.number_of_log_sheets != null
          ? String(summary.number_of_log_sheets)
          : '—',
      icon: ClipboardList,
      accent: 'bg-indigo-50 text-indigo-600',
      hint: 'Daily driver logs generated',
    },
    {
      key: 'estimated',
      label: 'Estimated Route',
      value: estimated ? 'Yes' : 'No',
      icon: Route,
      accent: estimated ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700',
      hint: estimated ? 'Distances approximated' : 'Routing confirmed',
    },
  ]
}

export default function SummaryCards({ summary, tripId, compact = false }) {
  if (!summary) {
    return (
      <Card title="Trip summary" description="Plan a trip to see HOS and mileage totals.">
        <EmptyState title="No trip data yet">
          Submit the form to generate summary metrics for your route.
        </EmptyState>
      </Card>
    )
  }

  const stats = buildStats(summary)
  const description = [
    'Miles, hours, and cycle usage for this plan',
    tripId != null ? `Trip #${tripId}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Card
      title="Trip summary"
      description={description}
      action={
        summary.estimated ? (
          <StatusBadge variant="fuel">Estimated routing</StatusBadge>
        ) : null
      }
      padding={false}
    >
      <div
        className={[
          'grid gap-3 p-4 sm:gap-4 sm:p-6',
          compact ? 'grid-cols-1 sm:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-4',
        ].join(' ')}
      >
        {stats.map((stat) => (
          <StatCard key={stat.key} {...stat} />
        ))}
      </div>
    </Card>
  )
}
