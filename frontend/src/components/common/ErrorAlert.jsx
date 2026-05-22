import { AlertCircle } from 'lucide-react'

export default function ErrorAlert({
  title = 'Something went wrong',
  message,
  className = '',
}) {
  if (!message) return null

  return (
    <div
      role="alert"
      className={[
        'flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-800',
        className,
      ].join(' ')}
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-red-700">{message}</p>
      </div>
    </div>
  )
}
