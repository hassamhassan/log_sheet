import { emptyState, emptyStateText, emptyStateTitle } from './uiClasses'

export default function EmptyState({ icon: Icon, title, children, className = '' }) {
  return (
    <div className={[emptyState, className].join(' ')}>
      {Icon && (
        <Icon className="mx-auto h-8 w-8 text-slate-400" aria-hidden />
      )}
      <p className={[emptyStateTitle, Icon ? 'mt-3' : ''].join(' ')}>{title}</p>
      {children && <p className={emptyStateText}>{children}</p>}
    </div>
  )
}
