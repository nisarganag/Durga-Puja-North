import { createContext, useContext } from 'react'
import { PATHS } from './paths'
import { DEFAULT_ROUTE, type Route, type Stop, type Stretch } from './route'

/** Everything the page needs to know about the route being followed, worked out once. */
export interface RouteModel {
  route: Route
  stops: Stop[]
  /** The start, pandals and stations: the stops that make up the walk itself. */
  main: Stop[]
  pandals: Stop[]
  stretches: Stretch[]
  start: Stop
  /** Where the main route ends (Sealdah on the built-in route). */
  finish: Stop
  optional: Stop[]
  /** Pandal numbers, 1-based, counting optional pandals too. */
  numbers: Map<string, number>
  previous: (id: string) => Stop | undefined
  next: (id: string) => Stop | undefined
  /** Street paths drawn on the map. Only the built-in route has them; others get straight lines. */
  paths: Record<string, { polyline: string; meters: number }>
}

const NUMBERED = new Set(['pandal', 'optional'])
const MAIN = new Set(['start', 'pandal', 'end'])

export function buildModel(route: Route): RouteModel {
  const stops = route.stops
  const index = new Map(stops.map((s, i) => [s.id, i]))
  const main = stops.filter((s) => MAIN.has(s.kind))
  const numbers = new Map<string, number>()
  stops.filter((s) => NUMBERED.has(s.kind)).forEach((s, i) => numbers.set(s.id, i + 1))

  return {
    route,
    stops,
    main,
    pandals: stops.filter((s) => s.kind === 'pandal'),
    stretches: buildStretches(route),
    start: stops[0],
    finish: main[main.length - 1] ?? stops[stops.length - 1],
    optional: stops.filter((s) => s.kind === 'optional'),
    numbers,
    previous: (id) => {
      const i = index.get(id)
      return i ? stops[i - 1] : undefined
    },
    next: (id) => {
      const i = index.get(id)
      return i === undefined ? undefined : stops[i + 1]
    },
    paths: pathsFor(route),
  }
}

const DEFAULT_INDEX = new Map(DEFAULT_ROUTE.stops.map((s, i) => [s.id, i]))

/**
 * Street paths exist only for legs of the built-in route. A copied route keeps them for
 * every leg that still joins the same two places; edited legs fall back to straight lines.
 */
function pathsFor(route: Route): RouteModel['paths'] {
  if (route.builtIn) return PATHS
  const out: RouteModel['paths'] = {}
  route.stops.forEach((stop, i) => {
    const prev = route.stops[i - 1]
    const at = DEFAULT_INDEX.get(stop.id)
    if (!prev || at === undefined || !PATHS[stop.id]) return
    const original = DEFAULT_ROUTE.stops[at]
    const originalPrev = DEFAULT_ROUTE.stops[at - 1]
    if (originalPrev?.id !== prev.id) return
    if (original.place?.placeId !== stop.place?.placeId || originalPrev.place?.placeId !== prev.place?.placeId) return
    out[stop.id] = PATHS[stop.id]
  })
  return out
}

function buildStretches(route: Route): Stretch[] {
  const { stops, sections } = route
  if (sections?.length) {
    const titles = new Map(sections.map((s) => [s.from, s.title]))
    const out: Stretch[] = []
    for (const stop of stops) {
      const title = titles.get(stop.id)
      if (title !== undefined || out.length === 0) out.push({ id: stop.id, title: title ?? route.title, stops: [] })
      out[out.length - 1].stops.push(stop)
    }
    return out
  }

  // Custom routes: the start plus four stops, then four at a time. With the last stop of
  // the stretch before, each "walk this stretch" link has five places, which is the most
  // Google Maps accepts in a phone browser (three waypoints).
  const chunks = [stops.slice(0, 5)]
  for (let i = 5; i < stops.length; i += 4) chunks.push(stops.slice(i, i + 4))
  return chunks
    .filter((c) => c.length > 0)
    .map((c) => ({
      id: c[0].id,
      title: c.length === 1 ? c[0].name : `${c[0].name} to ${c[c.length - 1].name}`,
      stops: c,
    }))
}

const RouteContext = createContext<RouteModel>(buildModel(DEFAULT_ROUTE))

export const RouteProvider = RouteContext.Provider

export function useRouteModel(): RouteModel {
  return useContext(RouteContext)
}
