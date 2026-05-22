import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

const STEPS = [
  'Validating trip',
  'Calculating route',
  'Applying HOS rules',
  'Drawing log sheets',
]

const STEP_INTERVAL_MS = 1600

export default function PlanningLoadingState({ className = '' }) {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
    }, STEP_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className={[
        'rounded-2xl border border-blue-100 bg-blue-50/60 px-6 py-10',
        className,
      ].join(' ')}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" aria-hidden />
        <div>
          <p className="text-base font-semibold text-slate-900">Planning your trip</p>
          <p className="mt-2 text-sm font-medium text-blue-700">
            {STEPS[stepIndex]}…
          </p>
        </div>
        <ol className="mt-2 flex flex-wrap justify-center gap-2">
          {STEPS.map((step, i) => (
            <li
              key={step}
              className={[
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                i <= stepIndex
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/80 text-slate-500',
              ].join(' ')}
            >
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
