import { useEffect, type RefObject } from 'react'

// Patterns for the string of lights in the hero, played back to back in random order,
// the way pandal lights cycle through their routines. Every pattern keeps each bulb
// under three flashes a second.

const TAU = Math.PI * 2
const FADE_S = 0.35
const FRAME_MS = 33

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const smoothstep = (x: number) => {
  const c = clamp01(x)
  return c * c * (3 - 2 * c)
}
const hash = (x: number) => {
  const s = Math.sin(x * 12.9898) * 43758.5453
  return s - Math.floor(s)
}

/** Brightness 0–1 for bulb i of n, t seconds in. r holds per-bulb random numbers, redrawn each time the pattern starts. */
type Brightness = (i: number, n: number, t: number, r: number[]) => number

const chase: Brightness = (i, n, t) => {
  const tail = 3.5
  const d = ((t * 7) % (n + tail)) - i
  return d >= 0 && d < tail ? (1 - d / tail) ** 1.5 : 0
}

const PATTERNS: Record<string, { duration: number; at: Brightness }> = {
  // A comet runs along the string with a fading tail.
  chase: { duration: 5, at: chase },
  // The same comet, right to left.
  chaseBack: { duration: 5, at: (i, n, t, r) => chase(n - 1 - i, n, t, r) },
  // One light swings end to end like a pendulum.
  swing: {
    duration: 6,
    at: (i, n, t) => clamp01(1 - Math.abs((n - 1) * (0.5 - 0.5 * Math.cos((TAU * t) / 2.6)) - i) / 1.4),
  },
  // Odd and even bulbs take turns.
  alternate: {
    duration: 4.8,
    at: (i, _n, t) => {
      const s = smoothstep(0.5 + Math.sin(TAU * 0.8 * t) * 2)
      return i % 2 === 0 ? s : 1 - s
    },
  },
  // Every third bulb, stepping along like a cinema marquee.
  marquee: { duration: 4.5, at: (i, _n, t) => ((i + Math.floor(t * 4)) % 3 === 0 ? 1 : 0.06) },
  // Each bulb twinkles at its own pace.
  twinkle: {
    duration: 6,
    at: (i, n, t, r) => Math.max(0, Math.sin(TAU * ((0.35 + r[i] * 0.55) * t + r[(i + 5) % n]))) ** 6,
  },
  // The whole string breathes in and out together.
  breathe: { duration: 5, at: (_i, _n, t) => 0.5 - 0.5 * Math.cos((TAU * t) / 2.5) },
  // Light up one by one, hold, then empty out from the far end.
  fill: {
    duration: 5.6,
    at: (i, n, t) => {
      const rate = 6
      const full = n / rate + 0.9
      return t < full ? smoothstep(t * rate - i) : smoothstep(1 - ((t - full) * rate - (n - 1 - i)))
    },
  },
  // Rings of light burst out from the middle.
  burst: {
    duration: 5,
    at: (i, n, t) => {
      const mid = (n - 1) / 2
      const ring = (t * 4.5) % (mid + 3)
      return clamp01(1 - Math.abs(ring - Math.abs(i - mid)) / 1.3)
    },
  },
  // A soft wave rolls along the string.
  wave: { duration: 6, at: (i, n, t) => (0.5 + 0.5 * Math.sin(TAU * (0.7 * t - (1.2 * i) / n))) ** 2 },
  // Random handfuls of bulbs pop on and fade.
  pops: {
    duration: 5,
    at: (i, _n, t, r) => {
      const beat = t / 0.4
      const on = hash(i * 31.7 + Math.floor(beat) * 7.13 + r[0] * 100) > 0.62
      return on ? 1 - (beat % 1) * 0.6 : 0
    },
  },
}

const NAMES = Object.keys(PATTERNS)

function pickNext(recent: string[]): string {
  const fresh = NAMES.filter((name) => !recent.includes(name))
  return fresh[Math.floor(Math.random() * fresh.length)]
}

/**
 * Drives the `--glow` custom property (0–1) on every `[data-bulb]` inside `ref`.
 * Runs only while the lights are on screen and the tab is visible, to spare the battery.
 * Change `bulbsKey` whenever the set of bulbs changes, so the show picks up the new ones.
 */
export function useLightShow(ref: RefObject<HTMLElement | null>, enabled: boolean, bulbsKey = '') {
  useEffect(() => {
    const root = ref.current
    if (!root || !enabled) return
    const bulbs = Array.from(root.querySelectorAll<HTMLElement>('[data-bulb]'))
    const n = bulbs.length
    if (n === 0) return

    const values: number[] = new Array(n).fill(0)
    let from: number[] = new Array(n).fill(0)
    let random = bulbs.map(() => Math.random())
    let name = 'chase'
    const recent: string[] = [name]
    let startedAt = performance.now()
    let paintedAt = 0
    let raf = 0
    let onScreen = true
    let pageVisible = !document.hidden

    const frame = (now: number) => {
      raf = 0
      if (!onScreen || !pageVisible) return
      raf = requestAnimationFrame(frame)
      if (now - paintedAt < FRAME_MS) return
      paintedAt = now

      let t = (now - startedAt) / 1000
      if (t >= PATTERNS[name].duration) {
        name = pickNext(recent)
        recent.push(name)
        if (recent.length > 4) recent.shift()
        random = bulbs.map(() => Math.random())
        from = values.slice()
        startedAt = now
        t = 0
      }

      const pattern = PATTERNS[name]
      const mix = t < FADE_S ? t / FADE_S : 1
      for (let i = 0; i < n; i++) {
        const target = pattern.at(i, n, t, random)
        values[i] = from[i] + (target - from[i]) * mix
        bulbs[i].style.setProperty('--glow', values[i].toFixed(3))
      }
    }

    const resume = () => {
      if (!raf && onScreen && pageVisible) raf = requestAnimationFrame(frame)
    }
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      resume()
    })
    observer.observe(root)
    const onVisibility = () => {
      pageVisible = !document.hidden
      resume()
    }
    document.addEventListener('visibilitychange', onVisibility)
    resume()

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      bulbs.forEach((b) => b.style.removeProperty('--glow'))
    }
  }, [ref, enabled, bulbsKey])
}
