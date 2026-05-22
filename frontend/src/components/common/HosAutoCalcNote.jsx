import { Sparkles } from 'lucide-react'

export default function HosAutoCalcNote({ className = '' }) {
  return (
    <p
      className={[
        'flex items-start gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm leading-relaxed text-slate-600 shadow-sm shadow-slate-900/5 sm:px-5',
        className,
      ].join(' ')}
    >
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" aria-hidden />
      <span>
        Stops and rests are automatically calculated from route distance, driving time,
        current cycle hours, and assessment HOS assumptions.
      </span>
    </p>
  )
}
