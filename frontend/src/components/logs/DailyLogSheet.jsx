import LogSheetGraph from './LogSheetGraph'
import { formatMiles } from '../../utils/formatters'
import { buildRemarkLines, formatLogHours } from '../../utils/logSheetUtils'

function FormLine({ label, value, className = '' }) {
  return (
    <div className={`px-3 py-3 leading-normal ${className}`}>
      <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-slate-600">
        {label}
      </span>
      <span className="block min-h-[1.35rem] border-b border-slate-400 pb-1.5 pt-0.5 text-sm font-medium leading-snug text-slate-900">
        {value || '\u00A0'}
      </span>
    </div>
  )
}

function SignatureLine({ label, value }) {
  return (
    <div className="px-3 py-3 leading-normal">
      <span className="mb-2 block text-[9px] font-bold uppercase tracking-wider text-slate-600">
        {label}
      </span>
      <span className="block min-h-[1.85rem] border-b-2 border-slate-900 pb-1.5 pt-0.5 text-sm font-semibold leading-snug text-slate-900">
        {value || '\u00A0'}
      </span>
    </div>
  )
}

export default function DailyLogSheet({ log, dayNumber, embedded = false }) {
  if (!log) return null

  const form = log.form ?? {}
  const remarks = buildRemarkLines(log)
  const displayDate = log.date ?? '—'
  const totalHours = log.totals?.total ?? 24

  return (
    <article
      className={[
        'log-sheet-paper mx-auto w-full max-w-full overflow-hidden rounded-xl border bg-white',
        embedded
          ? 'border-slate-300 shadow-sm'
          : 'border-slate-400 shadow-md shadow-slate-900/10 sm:rounded-2xl',
      ].join(' ')}
      aria-label={`Daily log sheet for ${displayDate}${dayNumber != null ? `, day ${dayNumber}` : ''}`}
    >
      <header className="rounded-t-xl border-b-2 border-slate-900 bg-white px-4 py-2.5 sm:rounded-t-2xl sm:px-5">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-slate-800">
          U.S. Department of Transportation
        </p>
        <h3 className="mt-0.5 text-center text-lg font-black uppercase tracking-tight text-slate-950 sm:text-xl">
          Driver&apos;s Daily Log
        </h3>
        <p className="text-center text-[11px] font-bold uppercase tracking-wide text-slate-700">
          One Calendar Day — 24 Hours
        </p>

        <div className="mt-1.5 grid grid-cols-1 gap-0 border-t border-slate-400 pt-2 sm:grid-cols-2">
          <div className="border-b border-slate-300 py-1.5 sm:border-b-0 sm:border-r sm:pr-6">
            <p className="text-[8px] font-bold uppercase leading-relaxed tracking-wider text-slate-600">
              Original — Submit to carrier within 13 days
            </p>
          </div>
          <div className="py-1.5 sm:pl-6">
            <p className="text-[8px] font-bold uppercase leading-relaxed tracking-wider text-slate-600 sm:text-right">
              Duplicate — Driver retains possession for eight days
            </p>
          </div>
        </div>
      </header>

      <div className="border-b border-slate-300 bg-slate-50/90 px-4 py-2 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-bold text-slate-900">
            Date: <span className="font-mono">{displayDate}</span>
          </span>
          {dayNumber != null && (
            <span className="text-xs font-semibold uppercase text-slate-500">
              Log day {dayNumber}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
        <div className="grid gap-0 divide-x divide-y divide-slate-300 overflow-hidden rounded-xl border border-slate-300 bg-white sm:grid-cols-2 lg:grid-cols-3">
          <FormLine label="Total Miles Driving Today" value={formatMiles(log.total_miles)} />
          <FormLine label="Carrier Name" value={form.carrier_name} />
          <FormLine
            label="Main Office Address"
            value={form.main_office_address}
            className="sm:col-span-2 lg:col-span-1"
          />
          <FormLine label="Vehicle Number" value={form.vehicle_number} />
          <FormLine label="Trailer Number" value={form.trailer_number} />
          <FormLine label="Shipping Document" value={form.shipping_document} />
        </div>

        <div className="grid gap-0 divide-x divide-slate-300 overflow-hidden rounded-xl border border-slate-300 bg-white sm:grid-cols-2">
          <SignatureLine label="Driver Name / Signature" value={form.driver_name} />
          <SignatureLine label="Co-Driver Name / Signature" value={form.co_driver_name} />
        </div>

        <div
          className="log-sheet-graph-wrap overflow-x-auto rounded-xl border-2 border-slate-800 bg-white px-3 py-3 sm:px-5 sm:py-4"
          role="region"
          aria-label="24-hour duty status graph. Scroll horizontally to view the full grid."
          tabIndex={0}
        >
          <LogSheetGraph log={log} />
        </div>

        <section className="overflow-hidden rounded-xl border-2 border-slate-400 bg-white">
          <h4 className="border-b-2 border-slate-400 bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-800">
            Remarks (Entries Relating to Your Duty Status)
          </h4>
          {remarks.length > 0 ? (
            <ul className="list-none space-y-2.5 px-4 py-4 font-mono text-sm leading-relaxed text-slate-900 sm:py-5">
              {remarks.map((line, index) => (
                <li
                  key={`${line}-${index}`}
                  className="border-b border-dotted border-slate-200 pb-1.5 last:border-0"
                >
                  {line}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-5 font-mono text-sm italic text-slate-400">—</p>
          )}
        </section>

        <p
          className="log-sheet-recap px-1 py-3 text-xs leading-relaxed text-slate-600 sm:py-3.5"
          aria-label={`Recap total hours ${formatLogHours(totalHours)}`}
        >
          <span className="font-medium">Recap — Total Hours </span>
          <span className="font-mono font-semibold tabular-nums text-slate-800">
            {formatLogHours(totalHours)}
          </span>
        </p>
      </div>
    </article>
  )
}
