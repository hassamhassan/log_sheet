const variants = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
  secondary:
    'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400',
  ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
