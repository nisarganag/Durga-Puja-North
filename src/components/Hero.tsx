import { useRef, type CSSProperties } from 'react'
import { useRouteModel } from '../data/model'
import { useLightShow } from '../lib/lightShow'
import { seenCount, stopState } from '../lib/routeState'
import type { Progress } from '../lib/time'
import { useMediaQuery } from '../lib/useMediaQuery'
import { useStoredState } from '../lib/useStoredState'
import { PauseIcon, PlayIcon, RouteIcon, ShareIcon } from './Icons'
import './Hero.css'

interface Props {
  progress: Progress
  nextId: string | undefined
  onShare: () => void
  onOpenRoutes: () => void
  /** Whether this phone has routes of its own yet. */
  hasOwnRoutes: boolean
}

const COUNT_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve']

// The wire is a quadratic curve from (-2, 8) through control (50, 82) to (102, 8),
// in a 100 × 60 box. With the control point centred, x is linear in t.
const wireY = (t: number) => 8 + 148 * t * (1 - t)

export function Hero({ progress, nextId, onShare, onOpenRoutes, hasOwnRoutes }: Props) {
  const model = useRouteModel()
  const { route, pandals, start, finish } = model
  const seen = seenCount(pandals, progress)
  const total = pandals.length
  const count = COUNT_WORDS[total] ?? String(total)
  const lede =
    route.lede ??
    `${count} pandal${total === 1 ? '' : 's'} from ${start.name} to ${finish.name}. Every stop opens straight in Google\u00a0Maps.`
  const string = useRef<HTMLDivElement>(null)
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [paused, setPaused] = useStoredState('thakur-dekha:lights-paused', false)
  useLightShow(string, !paused && !reduceMotion, pandals.map((p) => p.id).join())

  return (
    <header className="hero">
      <div className="string-wrap">
        <div className="string" ref={string} role="img" aria-label={`${seen} of ${total} pandals seen`}>
          <svg className="string-wire" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
            <path d="M -2 8 Q 50 82 102 8" vectorEffect="non-scaling-stroke" />
          </svg>
          {pandals.map((p, i) => {
            const t = (i + 1) / (total + 1)
            const style = {
              left: `${-2 + 104 * t}%`,
              top: `${(wireY(t) / 60) * 100}%`,
            } as CSSProperties
            return (
              <span key={p.id} data-bulb className={`string-bulb is-${stopState(p, progress, nextId)}`} style={style}>
                <span className="string-glass" />
              </span>
            )
          })}
        </div>
        {!reduceMotion && (
          <button
            type="button"
            className="string-toggle"
            onClick={() => setPaused(!paused)}
            aria-label={paused ? 'Play the lights' : 'Pause the lights'}
            title={paused ? 'Play the lights' : 'Pause the lights'}
          >
            {paused ? <PlayIcon size={14} /> : <PauseIcon size={14} />}
          </button>
        )}
      </div>

      <div className="hero-inner">
        <h1 className="hero-title">
          <span className="hero-bn" lang="bn">
            ঠাকুর দেখা
          </span>
          <span className="hero-en">{route.title}</span>
        </h1>
        <p className="hero-lede">{lede}</p>
        <div className="hero-actions">
          <button type="button" className="btn btn-ghost" onClick={onShare}>
            <ShareIcon size={18} />
            Share with the group
          </button>
          <button type="button" className="btn btn-ghost" onClick={onOpenRoutes}>
            <RouteIcon size={18} />
            {hasOwnRoutes ? 'Switch route' : 'Make your own route'}
          </button>
          <p className="hero-note">
            {seen === 0
              ? 'Mark each pandal as you see it and its bulb above stays lit. Your progress is saved on this phone.'
              : seen === total
                ? `All ${total} pandals seen.`
                : `${seen} of ${total} pandals seen so far.`}
          </p>
        </div>
      </div>
    </header>
  )
}
