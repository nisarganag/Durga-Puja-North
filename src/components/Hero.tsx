import type { CSSProperties } from 'react'
import { PANDALS } from '../data/route'
import { seenCount, stopState } from '../lib/routeState'
import type { Progress } from '../lib/time'
import { ShareIcon } from './Icons'
import './Hero.css'

interface Props {
  progress: Progress
  nextId: string | undefined
  onShare: () => void
}

// The wire is a quadratic curve from (-2, 8) through control (50, 82) to (102, 8),
// in a 100 × 60 box. With the control point centred, x is linear in t.
const wireY = (t: number) => 8 + 148 * t * (1 - t)

export function Hero({ progress, nextId, onShare }: Props) {
  const seen = seenCount(progress)
  const total = PANDALS.length

  return (
    <header className="hero">
      <div className="string" role="img" aria-label={`${seen} of ${total} pandals seen`}>
        <svg className="string-wire" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
          <path d="M -2 8 Q 50 82 102 8" vectorEffect="non-scaling-stroke" />
        </svg>
        {PANDALS.map((p, i) => {
          const t = (i + 1) / (total + 1)
          const style = {
            left: `${-2 + 104 * t}%`,
            top: `${(wireY(t) / 60) * 100}%`,
            '--i': i,
          } as CSSProperties
          return (
            <span key={p.id} className={`string-bulb is-${stopState(p, progress, nextId)}`} style={style}>
              <span className="string-glass" />
            </span>
          )
        })}
      </div>

      <div className="hero-inner">
        <h1 className="hero-title">
          <span className="hero-bn" lang="bn">
            ঠাকুর দেখা
          </span>
          <span className="hero-en">North Kolkata, pandal by pandal</span>
        </h1>
        <p className="hero-lede">
          Our Durga Puja route from Shyambazar to Sealdah: eleven pandals, about 5&nbsp;km on foot, and buses and autos
          for the longer hops. Every stop opens straight in Google&nbsp;Maps.
        </p>
        <div className="hero-actions">
          <button type="button" className="btn btn-ghost" onClick={onShare}>
            <ShareIcon size={18} />
            Share with the group
          </button>
          <p className="hero-note">
            {seen === 0
              ? 'Mark each pandal as you see it. The lights above fill in, and your progress stays on this phone.'
              : seen === total
                ? `All ${total} pandals seen.`
                : `${seen} of ${total} pandals seen so far.`}
          </p>
        </div>
      </div>
    </header>
  )
}
