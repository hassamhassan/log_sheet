/** Shared Tailwind class bundles for consistent ELD Trip Planner UI */

/** Centered page column (header, main, footer, hero) */
export const pageContainer = 'mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8'

export const sectionTitle =
  'text-lg font-semibold tracking-tight text-slate-900'

export const sectionDescription = 'mt-1 text-sm leading-relaxed text-slate-500'

export const cardSurface =
  'rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5'

export const emptyState =
  'rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-10 text-center sm:py-12'

export const emptyStateTitle = 'text-sm font-semibold text-slate-700'

export const emptyStateText = 'mt-1.5 text-sm leading-relaxed text-slate-500'

export const fieldLabel = 'text-sm font-medium text-slate-700'

export const fieldHint = 'mt-1 block text-xs leading-relaxed text-slate-500'

export const fieldError = 'mt-1 block text-xs font-medium text-red-600'

export const inputClass =
  'mt-1.5 w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'

/** Datetime-local: same box model as text inputs across WebKit/Gecko */
export const datetimeInputClass = [
  inputClass,
  'trip-form-datetime min-h-[2.75rem] appearance-none',
].join(' ')

export const requiredMark = 'ml-0.5 font-semibold text-red-600'

export const metaLabel =
  'text-xs font-semibold uppercase tracking-wide text-slate-500'

export const statLabel = 'text-sm font-medium text-slate-500'

export const statValue =
  'mt-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl'

export const statHint = 'mt-1 text-xs leading-relaxed text-slate-500'

export const innerPanel =
  'rounded-xl border border-slate-100 bg-slate-50/50'

export function tabButtonClass(isActive) {
  return [
    'rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
    isActive
      ? 'border-blue-600 bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/25 ring-offset-2'
      : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50',
  ].join(' ')
}

export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2'
