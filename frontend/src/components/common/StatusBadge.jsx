const variants = {
  default: 'bg-slate-200 text-slate-800 ring-1 ring-slate-300/80',
  primary: 'bg-blue-100 text-blue-800 ring-1 ring-blue-300/80',
  pickup: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/80',
  dropoff: 'bg-red-100 text-red-800 ring-1 ring-red-300/80',
  fuel: 'bg-amber-100 text-amber-950 ring-1 ring-amber-300/80',
  rest: 'bg-purple-100 text-purple-800 ring-1 ring-purple-300/80',
  restart: 'bg-slate-800 text-white ring-1 ring-slate-900',
  driving: 'bg-blue-100 text-blue-800 ring-1 ring-blue-300/80',
  offDuty: 'bg-slate-200 text-slate-800 ring-1 ring-slate-400/80',
  onDuty: 'bg-amber-100 text-amber-950 ring-1 ring-amber-400/80',
  sleeper: 'bg-indigo-100 text-indigo-900 ring-1 ring-indigo-300/80',
  success: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/80',
}

export default function StatusBadge({
  children,
  variant = 'default',
  className = '',
  ...props
}) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold sm:px-3 sm:py-1 sm:text-sm',
        variants[variant] ?? variants.default,
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}
