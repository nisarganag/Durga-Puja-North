import type { Stop } from '../data/route'
import { directionsUrl } from '../lib/maps'
import { doneLabels, legSummary } from '../lib/routeState'
import { formatClock, type Timing } from '../lib/time'
import { Bulb } from './Bulb'
import { CheckIcon, DirectionsIcon, HomeIcon } from './Icons'
import './NextUpBar.css'

interface Props {
  next: Stop | undefined
  timing: Timing | undefined
  home: string
  onToggleDone: (id: string) => void
  onSkip: (id: string) => void
  onAddHome: () => void
  onReset: () => void
}

export function NextUpBar({ next, timing, home, onToggleDone, onSkip, onAddHome, onReset }: Props) {
  if (!next) {
    return (
      <div className="nextup is-finished" role="region" aria-label="Route finished">
        <p className="nextup-done">
          <span lang="bn" className="nextup-bn">
            শুভ শারদীয়া!
          </span>
          <span>That’s the whole route.</span>
        </p>
        <button type="button" className="btn" onClick={onReset}>
          Start over
        </button>
      </div>
    )
  }

  const labels = doneLabels(next.kind)
  const lead = next.kind === 'start' ? 'Start at' : next.kind === 'optional' ? 'Optional' : 'Next'
  const how = next.kind === 'start' ? 'Meet here' : legSummary(next.leg)
  const when = timing ? `around ${formatClock(timing.arrive)}` : ''
  const destination = next.place ?? (home || undefined)

  return (
    <div className="nextup" role="region" aria-label="Next stop">
      <div className="nextup-info">
        <Bulb stop={next} state="next" size="sm" />
        <div className="nextup-text">
          <p className="nextup-name">
            <span className="nextup-lead">{lead}</span> {next.name}
          </p>
          <p className="nextup-how">{[how, when].filter(Boolean).join(', ')}</p>
        </div>
      </div>
      <div className="nextup-actions">
        {destination ? (
          <a
            className="btn btn-primary"
            href={directionsUrl(destination, next.leg?.travel ?? 'transit')}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DirectionsIcon size={18} />
            Directions
          </a>
        ) : (
          <button type="button" className="btn btn-primary" onClick={onAddHome}>
            <HomeIcon size={18} />
            Add home address
          </button>
        )}
        <button type="button" className="btn btn-toggle" onClick={() => onToggleDone(next.id)}>
          <CheckIcon size={18} />
          {labels.mark}
        </button>
        {next.kind === 'optional' && (
          <button type="button" className="text-btn nextup-skip" onClick={() => onSkip(next.id)}>
            Skip it, head home
          </button>
        )}
      </div>
    </div>
  )
}
