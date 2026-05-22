import { Loader2 } from 'lucide-react'

export default function LoadingState({ label = 'Loading…', className = '' }) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center gap-3 py-12 text-slate-500',
        className,
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}
