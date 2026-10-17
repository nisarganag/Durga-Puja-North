import { Fragment } from 'react'
import { previousStop, STRETCHES, type Leg, type Place, type Step, type Stop, type Stretch } from '../data/route'
import { directionsUrl, stretchUrl, waypointUrl } from '../lib/maps'
import { modeWords, stopState, type StopState } from '../lib/routeState'
import { formatClock, formatMeters, formatMinutes, legMinutes, type Progress, type Timing } from '../lib/time'
import { Bulb } from './Bulb'
import { HomeAddress } from './HomeAddress'
import { MapIcon, ModeIcon } from './Icons'
import { StopActions } from './StopActions'
import './RouteList.css'

interface Props {
  progress: Progress
  nextId: string | undefined
  selectedId: string
  flickerId: string | null
  timings: Record<string, Timing>
  home: string
  onHomeChange: (home: string) => void
  onSelect: (id: string) => void
  onToggleDone: (id: string) => void
  onSkip: (id: string) => void
}

const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six']

export function RouteList(props: Props) {
  return (
    <div className="route" id="route">
      {STRETCHES.map((stretch, i) => (
        <StretchSection key={stretch.id} stretch={stretch} before={STRETCHES[i - 1]} {...props} />
      ))}
    </div>
  )
}

function StretchSection({ stretch, before, ...props }: Props & { stretch: Stretch; before?: Stretch }) {
  const lastBefore = before?.stops[before.stops.length - 1]
  const places = [lastBefore, ...stretch.stops].flatMap((s) => (s?.place ? [s.place] : []))
  const pandals = stretch.stops.filter((s) => s.kind === 'pandal').length
  const travel = stretch.stops.reduce((sum, s) => sum + (legMinutes(s.leg) ?? 0), 0)
  const optional = stretch.stops.some((s) => s.kind === 'optional')
  const firstState = stopState(stretch.stops[0], props.progress, props.nextId)

  return (
    <section className="stretch" aria-labelledby={`stretch-${stretch.id}`}>
      <header className={`stretch-head line-${lineState(firstState)}`}>
        <span className="rail" aria-hidden="true" />
        <div className="stretch-text">
          <h2 id={`stretch-${stretch.id}`} className="stretch-title">
            {stretch.title}
          </h2>
          <p className="stretch-sub">
            {optional
              ? 'Only if you still have the energy.'
              : `${NUMBER_WORDS[pandals]} pandal${pandals === 1 ? '' : 's'}, with about ${formatMinutes(travel)} of getting between them.`}
          </p>
          {places.length >= 3 && (
            <a className="text-link stretch-link" href={stretchUrl(places)} target="_blank" rel="noopener noreferrer">
              <MapIcon size={16} />
              Walk this stretch in Google Maps
            </a>
          )}
        </div>
      </header>
      <ol className="stops">
        {stretch.stops.map((stop) => (
          <StopItem key={stop.id} stop={stop} {...props} />
        ))}
      </ol>
    </section>
  )
}

function lineState(state: StopState): 'lit' | 'live' | 'dim' {
  if (state === 'done') return 'lit'
  if (state === 'next') return 'live'
  return 'dim'
}

function StopItem({ stop, ...props }: Props & { stop: Stop }) {
  const { progress, nextId, selectedId, timings } = props
  const state = stopState(stop, progress, nextId)
  const selected = stop.id === selectedId
  const prev = previousStop(stop.id)
  const timing = timings[stop.id]
  const nextStopState = nextStopLine(stop, progress, nextId)

  return (
    <li className={`stop is-${state} kind-${stop.kind}${selected ? ' is-selected' : ''}`} id={`stop-${stop.id}`}>
      {stop.leg && <LegSteps leg={stop.leg} from={prev?.place} to={stop} line={lineState(state)} showLink={selected} />}
      <div className={`stop-row line-top-${lineState(state)} line-bottom-${nextStopState}`}>
        <span className="rail">
          <Bulb stop={stop} state={state} flicker={props.flickerId === stop.id} />
        </span>
        <div className="stop-body">
          <button type="button" className="stop-head" aria-expanded={selected} onClick={() => props.onSelect(stop.id)}>
            <span className="stop-name">{stop.name}</span>
            <TimeLabel state={state} timing={timing} />
            <span className="stop-bn" lang="bn">
              {stop.bn}
            </span>
          </button>
          <p className="stop-about">{stop.about}</p>
          {selected && (
            <div className="stop-detail">
              {stop.kind === 'home' && <HomeAddress key={props.home} home={props.home} onChange={props.onHomeChange} />}
              <StopActions stop={stop} state={state} home={props.home} onToggleDone={props.onToggleDone} onSkip={props.onSkip} />
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

/** The line below a bulb belongs to the leg that leaves it. */
function nextStopLine(stop: Stop, progress: Progress, nextId: string | undefined): 'lit' | 'live' | 'dim' | 'none' {
  const all = STRETCHES.flatMap((s) => s.stops)
  const after = all[all.findIndex((s) => s.id === stop.id) + 1]
  if (!after) return 'none'
  return lineState(stopState(after, progress, nextId))
}

function TimeLabel({ state, timing }: { state: StopState; timing?: Timing }) {
  if (state === 'skipped') return <span className="stop-time">Skipped</span>
  if (!timing) return <span className="stop-time" />
  if (timing.doneAt) return <span className="stop-time is-done">{formatClock(timing.doneAt)}</span>
  return <span className="stop-time">{formatClock(timing.arrive)}</span>
}

function LegSteps({ leg, from, to, line, showLink }: { leg: Leg; from?: Place; to: Stop; line: string; showLink: boolean }) {
  return (
    <div className={`leg line-${line}`}>
      {leg.steps.map((step, i) => (
        <div key={i} className={`step mode-${step.modes[0] === 'walk' ? 'walk' : 'ride'}`}>
          <span className="rail">
            <span className="bead" title={modeWords(step.modes)}>
              <ModeIcon mode={step.modes[0]} size={14} />
            </span>
          </span>
          <div className="step-body">
            <StepText step={step} />
            <span className="step-meta">
              {step.minutes !== undefined && (
                <span>
                  {step.estimated ? 'about ' : ''}
                  {formatMinutes(step.minutes)}
                </span>
              )}
              {step.meters !== undefined && <span>{formatMeters(step.meters)}</span>}
            </span>
            {step.or && (
              <span className="step-or">
                or {step.or.text.toLowerCase()}
                {step.or.minutes !== undefined && `, ${formatMinutes(step.or.minutes)}`}
              </span>
            )}
          </div>
        </div>
      ))}
      {showLink && from && to.place && (
        <div className="step step-link">
          <span className="rail" />
          <a className="text-link" href={directionsUrl(to.place, leg.travel, from)} target="_blank" rel="noopener noreferrer">
            <MapIcon size={16} />
            See this leg in Google Maps
          </a>
        </div>
      )}
    </div>
  )
}

function StepText({ step }: { step: Step }) {
  const label = step.to?.label
  const at = label ? step.text.indexOf(label) : -1
  if (!step.to || at < 0) return <span className="step-text">{step.text}</span>
  return (
    <span className="step-text">
      <Fragment>{step.text.slice(0, at)}</Fragment>
      <a className="waypoint" href={waypointUrl(step.to)} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
      <Fragment>{step.text.slice(at + label!.length)}</Fragment>
    </span>
  )
}
