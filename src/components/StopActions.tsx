import type { Stop } from '../data/route'
import { directionsUrl, placeUrl } from '../lib/maps'
import { doneLabels, type StopState } from '../lib/routeState'
import { CheckIcon, DirectionsIcon, PinIcon, SkipIcon } from './Icons'

interface Props {
  stop: Stop
  state: StopState
  home: string
  onToggleDone: (id: string) => void
  onSkip?: (id: string) => void
}

/** Directions, open in Google Maps, and mark as seen, for one stop. */
export function StopActions({ stop, state, home, onToggleDone, onSkip }: Props) {
  const labels = doneLabels(stop.kind)
  const done = state === 'done'
  const travel = stop.leg?.travel ?? 'transit'
  const destination = stop.place ?? (home || undefined)
  const canSkip = onSkip && (stop.kind === 'pandal' || stop.kind === 'optional') && state !== 'done' && state !== 'skipped'

  return (
    <div className="actions">
      {destination && (
        <a className="btn btn-primary" href={directionsUrl(destination, travel)} target="_blank" rel="noopener noreferrer">
          <DirectionsIcon size={18} />
          Directions
        </a>
      )}
      {stop.place && (
        <a className="btn" href={placeUrl(stop.place)} target="_blank" rel="noopener noreferrer">
          <PinIcon size={18} />
          Open in Google Maps
        </a>
      )}
      <button
        type="button"
        className={`btn btn-toggle${done ? ' is-on' : ''}`}
        aria-pressed={done}
        onClick={() => onToggleDone(stop.id)}
      >
        <CheckIcon size={18} />
        {done ? labels.done : labels.mark}
      </button>
      {canSkip && (
        <button type="button" className="text-btn skip-btn" onClick={() => onSkip(stop.id)}>
          <SkipIcon size={16} />
          Skip this one
        </button>
      )}
    </div>
  )
}
