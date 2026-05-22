import AppHeader from './AppHeader'
import { pageContainer } from '../common/uiClasses'

export default function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader />
      <main className={`${pageContainer} pb-8 pt-4 sm:pb-10 sm:pt-6`}>
        {children}
      </main>
      <footer className="no-print border-t border-slate-200 bg-white py-6">
        <p className={`${pageContainer} text-center text-sm text-slate-500`}>
          ELD Trip Planner — assessment demo · not certified ELD software
        </p>
      </footer>
    </div>
  )
}
