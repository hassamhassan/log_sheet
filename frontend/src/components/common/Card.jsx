import { cardSurface, sectionDescription, sectionTitle } from './uiClasses'

export default function Card({
  children,
  className = '',
  title,
  description,
  action,
  padding = true,
  id,
  ...rest
}) {
  return (
    <section id={id} className={[cardSurface, className].join(' ')} {...rest}>
      {(title || description || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:gap-4 sm:px-6 sm:py-4">
          <div className="min-w-0 flex-1">
            {title && <h2 className={sectionTitle}>{title}</h2>}
            {description && <p className={sectionDescription}>{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={padding ? 'p-4 sm:p-6' : ''}>{children}</div>
    </section>
  )
}
