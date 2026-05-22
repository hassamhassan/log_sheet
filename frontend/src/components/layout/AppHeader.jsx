import { Route, Truck } from 'lucide-react'
import { pageContainer } from '../common/uiClasses'

export default function AppHeader() {
  return (
    <header className="no-print">
      <div className="border-b border-slate-200 bg-white">
        <div
          className={`${pageContainer} flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-3.5`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20"
              aria-hidden
            >
              <Truck className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                ELD Trip Planner
              </h1>
              <p className="mt-0.5 text-sm text-slate-600 sm:text-[0.9375rem]">
                Plan compliant routes and generate driver daily logs
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 pl-13 text-sm text-slate-500 sm:pl-0">
            <Route className="h-4 w-4 text-blue-600" aria-hidden />
            <span>Route · Stops · Daily logs</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 pt-3 sm:pt-4">
        <div className={pageContainer}>
          <div className="app-hero" aria-hidden>
            <img
              src="/hero_img.png"
              alt=""
              className="app-hero__image"
              width={1672}
              height={941}
              decoding="async"
              fetchPriority="high"
            />
            <div className="app-hero__fade" aria-hidden />
          </div>
        </div>
      </div>
    </header>
  )
}
