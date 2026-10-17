import { useCallback, useState } from 'react'
import type { Stop } from '../data/route'
import { hasMapsKey } from '../lib/googleMaps'
import { doneLabels, legSummary, stopState } from '../lib/routeState'
import { formatClock, type Progress, type Timing } from '../lib/time'
import { Bulb } from './Bulb'
import EmbedMap from './EmbedMap'
import GoogleRouteMap from './GoogleRouteMap'
import { HomeAddress } from './HomeAddress'
import { StopActions } from './StopActions'
import './MapPanel.css'

interface Props {
  selected: Stop
  nextId: string | undefined
  progress: Progress
  timings: Record<string, Timing>
  home: string
  onHomeChange: (home: string) => void
  onSelect: (id: string) => void
  onToggleDone: (id: string) => void
  onSkip: (id: string) => void
  onNotify: (message: string) => void
  /** Desktop only: lets the card jump back to the next stop after browsing others. */
  next?: Stop
  onSelectNext?: () => void
}

export function MapPanel(props: Props) {
  const { selected, nextId, progress, timings } = props
  const [useEmbed, setUseEmbed] = useState(() => !hasMapsKey())
  const fallBack = useCallback(() => setUseEmbed(true), [])
  const state = stopState(selected, progress, nextId)
  const timing = timings[selected.id]

  let when = ''
  if (state === 'skipped') when = 'Skipped'
  else if (timing?.doneAt) when = `${doneLabels(selected.kind).done} ${formatClock(timing.doneAt)}`
  else if (timing) when = `Around ${formatClock(timing.arrive)}`

  return (
    <div className={`map-panel${useEmbed ? ' is-embed' : ''}`}>
      {useEmbed ? (
        <EmbedMap selected={selected} />
      ) : (
        <GoogleRouteMap
          selectedId={selected.id}
          nextId={nextId}
          progress={progress}
          onSelect={props.onSelect}
          onFail={fallBack}
          onNotify={props.onNotify}
        />
      )}
      <div className="map-card" aria-live="polite">
        <div className="map-card-head">
          <Bulb stop={selected} state={state} size="sm" />
          <div className="map-card-title">
            <h3>{selected.name}</h3>
            <p>
              {selected.id === nextId ? 'Next stop' : selected.bn}
              {when && <span className="map-card-when">{when}</span>}
            </p>
          </div>
        </div>
        {selected.leg && <p className="map-card-how">{legSummary(selected.leg)}</p>}
        {selected.kind === 'home' && <HomeAddress key={props.home} home={props.home} onChange={props.onHomeChange} />}
        <StopActions stop={selected} state={state} home={props.home} onToggleDone={props.onToggleDone} onSkip={props.onSkip} />
        {props.next && props.onSelectNext && props.next.id !== selected.id && (
          <button type="button" className="text-btn map-card-next" onClick={props.onSelectNext}>
            Back to the next stop, {props.next.name}
          </button>
        )}
      </div>
    </div>
  )
}
