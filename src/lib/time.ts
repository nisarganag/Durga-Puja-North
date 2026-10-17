import type { Leg, Step, Stop } from '../data/route'

export interface Plan {
  /** 24-hour "HH:MM" */
  start: string
  /** Minutes spent at each pandal */
  dwell: number
}

/** Stop id → when it was marked done (ms). 0 means skipped. */
export type Progress = Record<string, number>

export interface Timing {
  arrive: Date
  /** Set when the stop was marked done; later times are worked out from here. */
  doneAt?: Date
}

const MIN = 60_000
/** Marks older than this belong to another outing and stop driving the live estimates. */
const LIVE_WINDOW = 18 * 60 * MIN

export function stepMinutes(step: Step): number | undefined {
  if (step.minutes === undefined) return undefined
  return Array.isArray(step.minutes) ? (step.minutes[0] + step.minutes[1]) / 2 : step.minutes
}

export function legMinutes(leg: Leg | undefined): number | undefined {
  if (!leg) return 0
  let total = 0
  for (const step of leg.steps) {
    const m = stepMinutes(step)
    if (m === undefined) return undefined
    total += m
  }
  return total
}

export function isDone(progress: Progress, id: string): boolean {
  return (progress[id] ?? 0) > 0
}

export function isSkipped(progress: Progress, id: string): boolean {
  return progress[id] === 0
}

/**
 * Expected arrival at every stop. Starts from the planned departure, and once
 * stops get marked done, everything after the latest mark is re-timed from it.
 */
export function computeTimings(stops: Stop[], plan: Plan, progress: Progress, now = Date.now()): Record<string, Timing> {
  const [h, m] = plan.start.split(':').map(Number)
  const start = new Date(now)
  start.setHours(h, m, 0, 0)

  const out: Record<string, Timing> = {}
  let t = start.getTime()
  for (const stop of stops) {
    if (isSkipped(progress, stop.id)) continue
    const travel = legMinutes(stop.leg)
    if (travel === undefined) break
    t += travel * MIN
    const timing: Timing = { arrive: new Date(t) }

    const mark = progress[stop.id]
    if (mark > 0) {
      timing.doneAt = new Date(mark)
      if (now - mark < LIVE_WINDOW) t = mark
      else t += dwellFor(stop.kind, plan) * MIN
    } else {
      t += dwellFor(stop.kind, plan) * MIN
    }
    out[stop.id] = timing
  }
  return out
}

function dwellFor(kind: string, plan: Plan): number {
  return kind === 'pandal' || kind === 'optional' ? plan.dwell : 0
}

const clock = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })

export function formatClock(d: Date): string {
  return clock.format(d).replace(/\s?([ap])\.?m\.?/i, (_, x: string) => ` ${x.toLowerCase()}m`)
}

export function formatMinutes(m: number | [number, number]): string {
  if (Array.isArray(m)) return `${m[0]}–${m[1]} min`
  const rounded = Math.round(m)
  if (rounded < 60) return `${rounded} min`
  const h = Math.floor(rounded / 60)
  const rest = rounded % 60
  return rest ? `${h} h ${rest} min` : `${h} h`
}

export function formatMeters(m: number): string {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1).replace(/\.0$/, '')} km`
}

export function toTimeInput(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
