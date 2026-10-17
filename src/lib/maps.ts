import type { Place, Travel, Waypoint } from '../data/route'

// Google Maps URLs (https://developers.google.com/maps/documentation/urls). No API key needed.
// On phones these open the Google Maps app when it's installed, otherwise the browser.
const SEARCH = 'https://www.google.com/maps/search/?api=1'
const DIRECTIONS = 'https://www.google.com/maps/dir/?api=1'

export function placeUrl(place: Place): string {
  const q = new URLSearchParams({ query: place.query })
  if (place.placeId) q.set('query_place_id', place.placeId)
  return `${SEARCH}&${q}`
}

export function waypointUrl(waypoint: Waypoint): string {
  return `${SEARCH}&${new URLSearchParams({ query: waypoint.query })}`
}

/** Leave `from` out to start from wherever the phone is right now. */
export function directionsUrl(to: Place | string, travel: Travel, from?: Place): string {
  const q = new URLSearchParams()
  if (from) {
    q.set('origin', from.query)
    if (from.placeId) q.set('origin_place_id', from.placeId)
  }
  if (typeof to === 'string') {
    q.set('destination', to)
  } else {
    q.set('destination', to.query)
    if (to.placeId) q.set('destination_place_id', to.placeId)
  }
  q.set('travelmode', travel)
  return `${DIRECTIONS}&${q}`
}

/**
 * Walking directions through several stops. Mobile browsers accept at most 3 waypoints,
 * which is why the route is split into stretches of five places.
 */
export function stretchUrl(places: Place[]): string {
  const first = places[0]
  const last = places[places.length - 1]
  const middle = places.slice(1, -1)
  const q = new URLSearchParams({ origin: first.query, destination: last.query, travelmode: 'walking' })
  if (first.placeId) q.set('origin_place_id', first.placeId)
  if (last.placeId) q.set('destination_place_id', last.placeId)
  if (middle.length) {
    q.set('waypoints', middle.map((p) => p.query).join('|'))
    if (middle.every((p) => p.placeId)) q.set('waypoint_place_ids', middle.map((p) => p.placeId).join('|'))
  }
  return `${DIRECTIONS}&${q}`
}

// Keyless embeds. These use the classic maps.google.com "output=embed" format,
// which renders inside an iframe without an API key. Places go in by name rather than
// coordinates: coordinates snap to whatever shop is nearest and get labelled with it.
const name = (p: Place) => encodeURIComponent(p.query)

export function embedPlaceUrl(place: Place): string {
  return `https://maps.google.com/maps?${new URLSearchParams({ q: place.query, z: '17', output: 'embed' })}`
}

export function embedRouteUrl(places: Place[], travel: Travel): string {
  const [from, ...rest] = places
  const flag = travel === 'driving' ? '' : '&dirflg=w'
  return `https://maps.google.com/maps?saddr=${name(from)}&daddr=${rest.map(name).join('+to:')}${flag}&output=embed`
}
