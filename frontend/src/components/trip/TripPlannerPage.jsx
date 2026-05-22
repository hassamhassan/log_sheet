import { useCallback, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { planTrip } from '../../api/tripApi'
import { parseApiError } from '../../utils/apiErrors'
import { buildTripPlanPayload } from '../../utils/tripPayload'
import HosAutoCalcNote from '../common/HosAutoCalcNote'
import ErrorAlert from '../common/ErrorAlert'
import PlanningLoadingState from '../common/PlanningLoadingState'
import DailyLogsSection from '../logs/DailyLogsSection'
import RouteMap from '../map/RouteMap'
import RouteInstructions from './RouteInstructions'
import TripForm from './TripForm'
import SummaryCards from './SummaryCards'
import StopsTimeline from './StopsTimeline'

export default function TripPlannerPage() {
  const [tripResult, setTripResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handlePlanSubmit = useCallback(async (formValues) => {
    setErrorMessage(null)
    setTripResult(null)
    setIsLoading(true)

    try {
      const payload = buildTripPlanPayload(formValues)
      const data = await planTrip(payload)
      setTripResult(data)
    } catch (err) {
      setErrorMessage(parseApiError(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleReset = useCallback(() => {
    setTripResult(null)
    setErrorMessage(null)
  }, [])

  const hasResults = Boolean(tripResult) && !isLoading

  return (
    <div className="space-y-6 sm:space-y-8">
      <div
        className={[
          'no-print',
          hasResults ? 'grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8' : '',
        ].join(' ')}
      >
        <TripForm
          onSubmit={handlePlanSubmit}
          isLoading={isLoading}
          onReset={handleReset}
        />
        {hasResults && (
          <SummaryCards
            summary={tripResult.summary}
            tripId={tripResult.trip_id}
            compact
          />
        )}
      </div>

      {errorMessage && (
        <ErrorAlert
          className="no-print"
          title="Could not plan trip"
          message={errorMessage}
        />
      )}

      {isLoading && (
        <PlanningLoadingState key="trip-planning" className="no-print" />
      )}

      {hasResults && (
        <div className="space-y-6 sm:space-y-8">
          <div
            className="no-print flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3.5 shadow-sm shadow-emerald-900/5 sm:px-5"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
            <p className="text-sm font-semibold leading-relaxed text-emerald-900">
              Trip planned successfully. Review the map, stops, and daily logs below.
            </p>
          </div>

          <div className="no-print">
            <RouteMap route={tripResult.route} stops={tripResult.stops} />
          </div>

          <HosAutoCalcNote className="no-print" />

          <div className="no-print">
            <RouteInstructions
              route={tripResult.route}
              stops={tripResult.stops}
              summary={tripResult.summary}
            />
          </div>

          <div className="no-print">
            <StopsTimeline stops={tripResult.stops} />
          </div>

          <DailyLogsSection dailyLogs={tripResult.daily_logs} />
        </div>
      )}
    </div>
  )
}
