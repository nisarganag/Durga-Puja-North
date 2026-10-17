import { DEFAULT_ROUTE, type Leg, type Mode, type Place, type Route, type Step, type Stop, type StopKind, type Travel } from '../data/route'

export const DEFAULT_ID = DEFAULT_ROUTE.id

/** The built-in route keeps its original key so progress marked before custom routes existed survives. */
export function progressKey(routeId: string): string {
  return routeId === DEFAULT_ID ? 'thakur-dekha:progress' : `thakur-dekha:progress:${routeId}`
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function blankRoute(): Route {
  return {
    id: newId(),
    title: 'My pandal route',
    stops: [
      { id: newId(), kind: 'start', name: '', bn: '', about: '' },
      { id: newId(), kind: 'pandal', name: '', bn: '', about: '', leg: { steps: [{ text: '', modes: ['walk'] }], travel: 'walking' } },
    ],
  }
}

export function copyRoute(route: Route): Route {
  return {
    id: newId(),
    title: `${route.title} (my copy)`,
    stops: structuredClone(route.stops),
    updatedAt: Date.now(),
  }
}

/** Google Maps travel mode for a leg, judged by the first way listed for each step. */
export function travelFor(steps: Step[]): Travel {
  const primary = new Set(steps.map((s) => s.modes[0]))
  if (primary.has('bus') || primary.has('metro')) return 'transit'
  if (primary.has('auto') || primary.has('cab') || primary.has('toto')) return 'driving'
  return 'walking'
}

// Sharing: the whole route travels inside the link, compressed, so no server is needed.

export async function encodeRoute(route: Route): Promise<string> {
  const json = JSON.stringify({ v: 1, id: route.id, title: route.title, stops: route.stops })
  if (typeof CompressionStream === 'function') {
    const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'))
    return `z${toBase64Url(new Uint8Array(await new Response(stream).arrayBuffer()))}`
  }
  return `j${toBase64Url(new TextEncoder().encode(json))}`
}

export async function decodeRoute(code: string): Promise<Route | null> {
  try {
    const bytes = fromBase64Url(code.slice(1))
    let json: string
    if (code[0] === 'z') {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
      json = await new Response(stream).text()
    } else if (code[0] === 'j') {
      json = new TextDecoder().decode(bytes)
    } else {
      return null
    }
    return sanitizeRoute(JSON.parse(json))
  } catch {
    return null
  }
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((text.length + 3) % 4))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

// Links can come from anyone, so everything in them is checked and trimmed before use.

const KINDS: StopKind[] = ['start', 'pandal', 'end', 'optional', 'home']
const MODES: Mode[] = ['walk', 'bus', 'auto', 'toto', 'cab', 'metro']

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max).trim() : '')
const amount = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 100_000 ? Math.round(v) : undefined)
const coord = (v: unknown, limit: number) => (typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= limit ? v : undefined)
const record = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : null)

function cleanPlace(v: unknown): Place | undefined {
  const p = record(v)
  const query = p && text(p.query, 300)
  if (!p || !query) return undefined
  const place: Place = { query }
  const placeId = text(p.placeId, 120)
  if (/^[\w-]+$/.test(placeId)) place.placeId = placeId
  const lat = coord(p.lat, 90)
  const lng = coord(p.lng, 180)
  if (lat !== undefined && lng !== undefined) Object.assign(place, { lat, lng })
  return place
}

function cleanStep(v: unknown): Step | undefined {
  const s = record(v)
  if (!s) return undefined
  const modes = Array.isArray(s.modes) ? MODES.filter((m) => (s.modes as unknown[]).includes(m)) : []
  const step: Step = { text: text(s.text, 160), modes: modes.length ? orderLike(s.modes as unknown[], modes) : ['walk'] }
  if (Array.isArray(s.minutes) && s.minutes.length === 2) {
    const [a, b] = s.minutes.map(amount)
    if (a !== undefined && b !== undefined) step.minutes = [Math.min(a, b), Math.max(a, b)]
  } else if (amount(s.minutes) !== undefined) {
    step.minutes = amount(s.minutes)
  }
  if (amount(s.meters) !== undefined) step.meters = amount(s.meters)
  const to = record(s.to)
  if (to && text(to.label, 80) && text(to.query, 200)) step.to = { label: text(to.label, 80), query: text(to.query, 200) }
  if (s.estimated === true) step.estimated = true
  return step
}

/** Keep the order the modes were listed in ("walk or toto" stays walk first). */
function orderLike(listed: unknown[], valid: Mode[]): Mode[] {
  return listed.filter((m): m is Mode => valid.includes(m as Mode)).filter((m, i, all) => all.indexOf(m) === i)
}

export function sanitizeRoute(raw: unknown): Route | null {
  const r = record(raw)
  const title = r && text(r.title, 120)
  if (!r || !title || !Array.isArray(r.stops)) return null

  const stops: Stop[] = []
  for (const item of r.stops.slice(0, 60)) {
    const s = record(item)
    const name = s && text(s.name, 120)
    if (!s || !name) return null
    const leg = record(s.leg)
    const steps = leg && Array.isArray(leg.steps) ? leg.steps.slice(0, 12).flatMap((x) => cleanStep(x) ?? []) : []
    stops.push({
      id: text(s.id, 40).replace(/[^\w-]/g, '') || newId(),
      kind: KINDS.includes(s.kind as StopKind) ? (s.kind as StopKind) : 'pandal',
      name,
      bn: text(s.bn, 120),
      about: text(s.about, 400),
      place: cleanPlace(s.place),
      leg: { steps, travel: travelFor(steps) },
    })
  }
  if (stops.length < 2) return null
  return { id: text(r.id, 40).replace(/[^\w-]/g, '') || newId(), title, stops: normalizeStops(stops), updatedAt: Date.now() }
}

/**
 * Rules every route keeps: the first stop is the start and has no way in; "start" appears
 * nowhere else; home can only be the last stop; ids are unique.
 */
export function normalizeStops(stops: Stop[]): Stop[] {
  const seen = new Set<string>()
  return stops.map((stop, i) => {
    let id = stop.id
    while (seen.has(id)) id = newId()
    seen.add(id)
    if (i === 0) return { ...stop, id, kind: 'start', leg: undefined }
    let kind = stop.kind
    if (kind === 'start' || (kind === 'home' && i !== stops.length - 1)) kind = 'pandal'
    const leg: Leg = stop.leg ?? { steps: [], travel: 'walking' }
    return { ...stop, id, kind, leg, place: kind === 'home' ? undefined : stop.place }
  })
}
