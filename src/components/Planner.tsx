import { useRouteModel } from '../data/model'
import { formatClock, formatMinutes, legMinutes, toTimeInput, type Plan, type Timing } from '../lib/time'
import { MinusIcon, PlusIcon } from './Icons'
import './Planner.css'

interface Props {
  plan: Plan
  onChange: (plan: Plan) => void
  timings: Record<string, Timing>
  live: boolean
}

export function Planner({ plan, onChange, timings, live }: Props) {
  const { start, finish, optional } = useRouteModel()
  const end = timings[finish.id]
  const setDwell = (dwell: number) => onChange({ ...plan, dwell: Math.min(60, Math.max(5, dwell)) })
  const optionalExtra = optional.reduce((sum, s) => sum + (legMinutes(s.leg) ?? 0) + plan.dwell, 0)

  return (
    <section className="planner" aria-labelledby="planner-title">
      <h2 id="planner-title" className="planner-title">
        Plan the evening
      </h2>
      <div className="planner-fields">
        <label className="field">
          <span className="field-label">Leave {start.name || 'the start'} at</span>
          <span className="field-row">
            <input
              type="time"
              className="time-input"
              value={plan.start}
              onChange={(e) => e.target.value && onChange({ ...plan, start: e.target.value })}
            />
            <button type="button" className="text-btn" onClick={() => onChange({ ...plan, start: toTimeInput(new Date()) })}>
              Now
            </button>
          </span>
        </label>
        <div className="field">
          <span className="field-label" id="dwell-label">
            Time at each pandal
          </span>
          <span className="stepper" role="group" aria-labelledby="dwell-label">
            <button type="button" aria-label="5 minutes less" onClick={() => setDwell(plan.dwell - 5)} disabled={plan.dwell <= 5}>
              <MinusIcon size={18} />
            </button>
            <output aria-live="polite">{plan.dwell} min</output>
            <button type="button" aria-label="5 minutes more" onClick={() => setDwell(plan.dwell + 5)} disabled={plan.dwell >= 60}>
              <PlusIcon size={18} />
            </button>
          </span>
        </div>
      </div>
      {end && finish !== start && (
        <p className="planner-result">
          {end.doneAt ? (
            <>
              You reached {finish.name} at <strong>{formatClock(end.doneAt)}</strong>.
            </>
          ) : (
            <>
              You’d reach {finish.name} around <strong>{formatClock(end.arrive)}</strong>.
              {optional.length === 1 && ` ${optional[0].name} adds about ${formatMinutes(optionalExtra)}.`}
              {optional.length > 1 && ` The optional stops add about ${formatMinutes(optionalExtra)}.`}
            </>
          )}{' '}
          {end.doneAt
            ? null
            : live
              ? 'Times after your last marked stop are worked out from when you marked it.'
              : 'Times are estimates; puja crowds decide the rest.'}
        </p>
      )}
    </section>
  )
}
