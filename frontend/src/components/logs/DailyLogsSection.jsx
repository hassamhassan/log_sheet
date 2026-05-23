import { useMemo } from 'react'
import { FileText, Printer } from 'lucide-react'
import Button from '../common/Button'
import Card from '../common/Card'
import EmptyState from '../common/EmptyState'
import { sectionDescription, sectionTitle } from '../common/uiClasses'
import DailyLogSheet from './DailyLogSheet'

const LOG_PANEL_ID = 'log-sheets-panel'

function DailyLogsSectionView({ logs }) {
  const handlePrintLogs = () => {
    window.print()
  }

  return (
    <Card
      id="daily-log-sheets"
      title="Daily Log Sheet"
      padding={false}
      data-log-view="all"
      action={
        <Button
          type="button"
          variant="secondary"
          onClick={handlePrintLogs}
          aria-label="Print log"
          className="no-print shrink-0"
        >
          <Printer className="h-4 w-4" aria-hidden />
          Print log
        </Button>
      }
    >
      <div
        id={LOG_PANEL_ID}
        aria-label="Daily log sheet"
        className="log-sheet-stack flex flex-col gap-10 p-4 sm:gap-14 sm:p-6"
      >
        {logs.map((log, index) => (
          <div
            key={`${log.date}-${index}`}
            className="log-sheet-stack__item"
            data-log-day={index + 1}
          >
            <DailyLogSheet log={log} dayNumber={index + 1} embedded />
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function DailyLogsSection({ dailyLogs }) {
  const logs = useMemo(
    () => (Array.isArray(dailyLogs) ? dailyLogs.filter(Boolean) : []),
    [dailyLogs],
  )

  const logsKey = useMemo(() => logs.map((log) => log.date).join('|'), [logs])

  if (logs.length === 0) {
    return (
      <section className="space-y-4 no-print" aria-labelledby="daily-logs-heading">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100"
            aria-hidden
          >
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <h2 id="daily-logs-heading" className={sectionTitle}>
              Daily Log Sheet
            </h2>
            <p className={sectionDescription}>
              24-hour duty grids generated from your trip plan
            </p>
          </div>
        </div>
        <Card>
          <EmptyState title="No log sheets yet">
            Enter trip details to generate route, stops, and daily logs.
          </EmptyState>
        </Card>
      </section>
    )
  }

  return <DailyLogsSectionView key={logsKey} logs={logs} />
}
