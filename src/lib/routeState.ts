import { PANDALS, STOPS, type Leg, type Mode, type Stop, type StopKind } from '../data/route'
import { formatMinutes, isDone, isSkipped, type Progress } from './time'

export type StopState = 'done' | 'next' | 'upcoming' | 'skipped'

/** The first open stop after the furthest one marked, so a forgotten tap doesn't hold you back. */
export function findNext(progress: Progress): Stop | undefined {
  let last = -1
  STOPS.forEach((s, i) => {
    if (s.id in progress) last = i
  })
  return STOPS.slice(last + 1).find((s) => !(s.id in progress))
}

export function stopState(stop: Stop, progress: Progress, nextId: string | undefined): StopState {
  if (isDone(progress, stop.id)) return 'done'
  if (isSkipped(progress, stop.id)) return 'skipped'
  return stop.id === nextId ? 'next' : 'upcoming'
}

export function seenCount(progress: Progress): number {
  return PANDALS.filter((p) => isDone(progress, p.id)).length
}

const MODE_WORD: Record<Mode, string> = {
  walk: 'walk',
  bus: 'bus',
  auto: 'auto',
  toto: 'toto',
  cab: 'cab',
  metro: 'metro',
}

export function modeWords(modes: Mode[]): string {
  return modes.map((m) => MODE_WORD[m]).join(' or ')
}

/** "Walk 2 min, bus 5 min, walk 5 min" */
export function legSummary(leg: Leg | undefined): string {
  if (!leg) return ''
  const parts = leg.steps.map((s) => {
    const words = modeWords(s.modes)
    return s.minutes === undefined ? words : `${words} ${formatMinutes(s.minutes)}`
  })
  const text = parts.join(', ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function doneLabels(kind: StopKind): { mark: string; done: string } {
  switch (kind) {
    case 'start':
    case 'end':
      return { mark: 'Mark as reached', done: 'Reached' }
    case 'home':
      return { mark: 'Mark as home', done: 'Home safe' }
    default:
      return { mark: 'Mark as seen', done: 'Seen' }
  }
}
