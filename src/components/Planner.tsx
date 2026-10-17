import { formatClock, formatMinutes, legMinutes, toTimeInput, type Plan, type Timing } from '../lib/time'
import { STOPS } from '../data/route'
import { MinusIcon, PlusIcon } from './Icons'
import './Planner.css'

interface Props {
  plan: Plan
  onChange: (plan: Plan) => void
  timings: Record<string, Timing>
  live: boolean
}

const tala = STOPS.find((s) => s.id === 'tala')!

export function Planner({ plan, onChange, timings, live }: Props) {
  const sealdah = timings.sealdah
  const setDwell = (dwell: number) => onChange({ ...plan, dwell: Math.min(60, Math.max(5, dwell)) })
  const talaExtra = (legMinutes(tala.leg) ?? 0) + plan.dwell

  return (
    <section className="planner" aria-labelledby="planner-title">
      <h2 id="planner-title" className="planner-title">
        Plan the evening
      </h2>
      <div className="planner-fields">
        <label className="field">
          <span className="field-label">Leave Shyambazar at</span>
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
      {sealdah && (
        <p className="planner-result">
          {sealdah.doneAt ? (
            <>
              You reached Sealdah at <strong>{formatClock(sealdah.doneAt)}</strong>.
            </>
          ) : (
            <>
              You’d reach Sealdah around <strong>{formatClock(sealdah.arrive)}</strong>. Tala Prattoy adds about{' '}
              {formatMinutes(talaExtra)}.
            </>
          )}{' '}
          {live ? 'Times after your last marked stop are worked out from when you marked it.' : 'Times are estimates; puja crowds decide the rest.'}
        </p>
      )}
    </section>
  )
}
