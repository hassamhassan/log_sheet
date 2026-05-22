import { Info } from 'lucide-react'

const NOTE =
  'This planner uses assessment assumptions: property-carrying driver, 70 hrs / 8 days, no adverse driving conditions, fuel every 1,000 miles, 1 hour pickup/dropoff.'

export default function ComplianceNote({ className = '' }) {
  return (
    <aside
      className={[
        'compliance-note flex gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm',
        className,
      ].join(' ')}
    >
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden />
      <p>{NOTE}</p>
    </aside>
  )
}
