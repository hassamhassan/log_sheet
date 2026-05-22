import {
  formatDateTimeRange,
  formatHours,
  titleCaseStatus,
  titleCaseType,
} from '../../utils/formatters'

export default function StopPopupContent({ marker }) {
  const stop = marker?.stop
  const kind = marker?.kind ?? stop?.type

  const schedule =
    stop?.start_datetime && stop?.end_datetime
      ? { start: stop.start_datetime, end: stop.end_datetime }
      : null

  return (
    <div className="min-w-[11rem] text-sm text-slate-800">
      <p className="font-semibold text-slate-900">{titleCaseType(kind)}</p>

      {stop?.status && (
        <p className="mt-1.5">
          <span className="font-medium text-slate-500">Status: </span>
          {titleCaseStatus(stop.status)}
        </p>
      )}

      {schedule && (
        <p className="mt-1">
          <span className="font-medium text-slate-500">Schedule: </span>
          {formatDateTimeRange(schedule.start, schedule.end)}
        </p>
      )}

      {stop?.duration_hours != null && Number(stop.duration_hours) > 0 && (
        <p className="mt-1">
          <span className="font-medium text-slate-500">Duration: </span>
          {formatHours(stop.duration_hours)}
        </p>
      )}

      {stop?.location && (
        <p className="mt-1 text-slate-700">{stop.location}</p>
      )}

      {stop?.remark && (
        <p className={`text-slate-600 ${stop?.location ? 'mt-1 text-xs' : 'mt-1'}`}>
          {stop.remark}
        </p>
      )}

      {!stop && marker?.kind === 'current' && (
        <p className="mt-1 text-slate-600">Trip start — current location</p>
      )}
      {!stop && marker?.kind !== 'current' && marker?.label && (
        <p className="mt-1 text-slate-500">Route {marker.label} point</p>
      )}
    </div>
  )
}
