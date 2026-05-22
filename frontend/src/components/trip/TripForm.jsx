import { forwardRef } from 'react'
import { useForm } from 'react-hook-form'
import {
  ChevronDown,
  ClipboardList,
  Info,
  RotateCcw,
  Route,
  Sparkles,
} from 'lucide-react'
import Button from '../common/Button'
import Card from '../common/Card'
import {
  datetimeInputClass,
  fieldError,
  fieldHint,
  fieldLabel,
  focusRing,
  inputClass,
  innerPanel,
  requiredMark,
} from '../common/uiClasses'
import {
  defaultTripFormValues,
  sampleTripFormValues,
  validateLocation,
} from '../../utils/tripPayload'

function FormSection({ title, description, children }) {
  return (
    <fieldset className="min-w-0 space-y-4">
      <legend className="sr-only">{title}</legend>
      <div className="border-b border-slate-100 pb-2">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
        )}
      </div>
      {children}
    </fieldset>
  )
}

function FieldHelp({ id, children }) {
  return (
    <p id={id} className="mt-1 flex gap-1.5 text-xs leading-relaxed text-slate-500">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
      <span>{children}</span>
    </p>
  )
}

function Field({
  label,
  htmlFor,
  error,
  children,
  hint,
  help,
  required,
}) {
  const hintId = help || hint ? `${htmlFor}-hint` : undefined
  const errorId = error ? `${htmlFor}-error` : undefined

  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className="block">
        <span className={fieldLabel}>
          {label}
          {required && (
            <>
              <span className={requiredMark} aria-hidden>
                *
              </span>
              <span className="sr-only"> (required)</span>
            </>
          )}
        </span>
        {help && <FieldHelp id={hintId}>{help}</FieldHelp>}
        {children}
        {hint && !help && (
          <span id={hintId} className={fieldHint}>
            {hint}
          </span>
        )}
        {hint && help && (
          <span id={`${htmlFor}-extra`} className={fieldHint}>
            {hint}
          </span>
        )}
        {error && (
          <span id={errorId} className={fieldError} role="alert">
            {error}
          </span>
        )}
      </label>
    </div>
  )
}

const FieldInput = forwardRef(function FieldInput(
  { id, describedBy, required, className, 'aria-invalid': ariaInvalid, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      id={id}
      aria-describedby={describedBy}
      aria-required={required || undefined}
      aria-invalid={ariaInvalid}
      className={className}
      {...props}
    />
  )
})

const locationRules = {
  required: 'Location is required.',
  validate: validateLocation,
}

const cycleRules = {
  required: 'Cycle hours are required.',
  valueAsNumber: true,
  min: { value: 0, message: 'Must be at least 0 hours.' },
  max: { value: 70, message: 'Must be at most 70 hours.' },
}

export default function TripForm({ onSubmit, isLoading = false, onReset }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: defaultTripFormValues() })

  const handleLoadSample = () => {
    reset(sampleTripFormValues())
  }

  const handleReset = () => {
    reset(defaultTripFormValues())
    onReset?.()
  }

  const describe = (id, hasHelp, hasHint, hasError) => {
    const parts = []
    if (hasHelp || hasHint) parts.push(`${id}-hint`)
    if (hasHint && hasHelp) parts.push(`${id}-extra`)
    if (hasError) parts.push(`${id}-error`)
    return parts.length ? parts.join(' ') : undefined
  }

  return (
    <Card
      title="Trip Details"
      description="Enter your route and cycle hours to generate a compliant plan and daily logs."
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="trip-form space-y-8 sm:space-y-9"
        noValidate
        aria-label="Trip details"
      >
        <FormSection
          title="Route"
          description="City or address for each leg of the trip"
        >
          <div className="grid grid-cols-1 gap-5 sm:gap-4 md:grid-cols-3">
            <Field
              label="Current Location"
              htmlFor="current_location"
              required
              error={errors.current_location?.message}
            >
              <FieldInput
                id="current_location"
                describedBy={describe(
                  'current_location',
                  false,
                  false,
                  Boolean(errors.current_location),
                )}
                required
                className={inputClass}
                placeholder="e.g. Dallas, TX"
                disabled={isLoading}
                autoComplete="address-line1"
                {...register('current_location', locationRules)}
                aria-invalid={errors.current_location ? true : undefined}
              />
            </Field>
            <Field
              label="Pickup Location"
              htmlFor="pickup_location"
              required
              error={errors.pickup_location?.message}
            >
              <FieldInput
                id="pickup_location"
                describedBy={describe(
                  'pickup_location',
                  false,
                  false,
                  Boolean(errors.pickup_location),
                )}
                required
                className={inputClass}
                placeholder="e.g. Houston, TX"
                disabled={isLoading}
                {...register('pickup_location', locationRules)}
                aria-invalid={errors.pickup_location ? true : undefined}
              />
            </Field>
            <Field
              label="Dropoff Location"
              htmlFor="dropoff_location"
              required
              error={errors.dropoff_location?.message}
            >
              <FieldInput
                id="dropoff_location"
                describedBy={describe(
                  'dropoff_location',
                  false,
                  false,
                  Boolean(errors.dropoff_location),
                )}
                required
                className={inputClass}
                placeholder="e.g. Atlanta, GA"
                disabled={isLoading}
                {...register('dropoff_location', locationRules)}
                aria-invalid={errors.dropoff_location ? true : undefined}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection
          title="Hours of service"
          description="Cycle usage and when the trip starts for HOS and log scheduling"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
            <Field
              label="Current Cycle Used (Hrs)"
              htmlFor="current_cycle_used_hours"
              required
              hint="Enter a value from 0 to 70"
              error={errors.current_cycle_used_hours?.message}
            >
              <FieldInput
                id="current_cycle_used_hours"
                describedBy={describe(
                  'current_cycle_used_hours',
                  false,
                  true,
                  Boolean(errors.current_cycle_used_hours),
                )}
                required
                type="number"
                inputMode="decimal"
                step="0.5"
                min={0}
                max={70}
                className={inputClass}
                disabled={isLoading}
                {...register('current_cycle_used_hours', cycleRules)}
                aria-invalid={errors.current_cycle_used_hours ? true : undefined}
              />
            </Field>
            <Field
              label="Start Date/Time"
              htmlFor="start_datetime"
              required
              hint="Uses your device local timezone"
              error={errors.start_datetime?.message}
            >
              <FieldInput
                id="start_datetime"
                describedBy={describe(
                  'start_datetime',
                  false,
                  true,
                  Boolean(errors.start_datetime),
                )}
                required
                type="datetime-local"
                className={datetimeInputClass}
                disabled={isLoading}
                {...register('start_datetime', {
                  required: 'Start date and time are required.',
                })}
                aria-invalid={errors.start_datetime ? true : undefined}
              />
            </Field>
          </div>
        </FormSection>

        <details
          id="trip-form-advanced"
          className={[
            'group min-w-0 open:bg-white',
            innerPanel,
            'open:border-slate-200 open:shadow-sm',
          ].join(' ')}
        >
          <summary
            className={[
              'flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-3.5 marker:content-none sm:px-5 sm:py-4',
              '[&::-webkit-details-marker]:hidden',
              focusRing,
              'rounded-xl',
            ].join(' ')}
            aria-controls="trip-form-advanced-panel"
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <ClipboardList className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                Advanced — log sheet details
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                Optional. Fills driver, carrier, and equipment fields on printed daily logs.
              </span>
            </span>
            <ChevronDown
              className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <div
            id="trip-form-advanced-panel"
            className="grid grid-cols-1 gap-5 border-t border-slate-100 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5 lg:grid-cols-3"
          >
            <Field label="Driver Name" htmlFor="driver_name">
              <FieldInput
                id="driver_name"
                className={inputClass}
                placeholder="Printed on log signature line"
                disabled={isLoading}
                autoComplete="name"
                {...register('driver_name')}
              />
            </Field>
            <Field label="Carrier Name" htmlFor="carrier_name">
              <FieldInput
                id="carrier_name"
                className={inputClass}
                placeholder="Motor carrier name"
                disabled={isLoading}
                autoComplete="organization"
                {...register('carrier_name')}
              />
            </Field>
            <Field label="Main Office Address" htmlFor="main_office_address">
              <FieldInput
                id="main_office_address"
                className={inputClass}
                placeholder="Carrier principal place of business"
                disabled={isLoading}
                {...register('main_office_address')}
              />
            </Field>
            <Field label="Vehicle Number" htmlFor="vehicle_number">
              <FieldInput
                id="vehicle_number"
                className={inputClass}
                placeholder="e.g. TRK-100"
                disabled={isLoading}
                {...register('vehicle_number')}
              />
            </Field>
            <Field label="Trailer Number" htmlFor="trailer_number">
              <FieldInput
                id="trailer_number"
                className={inputClass}
                placeholder="e.g. TRL-900"
                disabled={isLoading}
                {...register('trailer_number')}
              />
            </Field>
            <Field label="Shipping Document" htmlFor="shipping_document">
              <FieldInput
                id="shipping_document"
                className={inputClass}
                placeholder="e.g. BOL or pro number"
                disabled={isLoading}
                {...register('shipping_document')}
              />
            </Field>
          </div>
        </details>

        <div className="flex min-w-0 flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            aria-busy={isLoading}
            className="w-full sm:w-auto"
          >
            <Route className="h-4 w-4" aria-hidden />
            Generate Route &amp; Logs
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={isLoading}
            onClick={handleLoadSample}
            aria-label="Load sample trip with Dallas, Houston, and Atlanta"
            className="w-full sm:w-auto"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Load Sample Trip
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            disabled={isLoading}
            onClick={handleReset}
            aria-label="Reset trip form to defaults"
            className="w-full sm:w-auto"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Reset
          </Button>
        </div>
      </form>
    </Card>
  )
}
