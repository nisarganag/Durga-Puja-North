export type Mode = 'walk' | 'bus' | 'auto' | 'toto' | 'cab' | 'metro'

/** Google Maps travel mode used when opening directions for a leg. */
export type Travel = 'walking' | 'transit' | 'driving'

export interface Place {
  /** Name as Google Maps lists it. Used as the search text and as a fallback if the place ID stops resolving. */
  query: string
  /** Google place ID, so links open the exact pandal instead of a list of guesses. */
  placeId?: string
  lat: number
  lng: number
}

/** A road or crossing where you change from walking to a bus or auto. */
export interface Waypoint {
  label: string
  query: string
}

export interface Step {
  text: string
  /** More than one mode means "either works", e.g. auto or bus. */
  modes: Mode[]
  /** A range means "somewhere between", e.g. [10, 15]. */
  minutes?: number | [number, number]
  meters?: number
  to?: Waypoint
  /** Minutes were not in the original plan and are our estimate. */
  estimated?: boolean
  /** A different way to do the same step, with its own timing. */
  or?: { text: string; modes: Mode[]; minutes?: number }
}

export interface Leg {
  steps: Step[]
  travel: Travel
}

export type StopKind = 'start' | 'pandal' | 'end' | 'optional' | 'home'

export interface Stop {
  id: string
  kind: StopKind
  name: string
  bn: string
  about: string
  place?: Place
  /** How to get here from the previous stop. */
  leg?: Leg
}

export interface Stretch {
  id: string
  title: string
  stops: Stop[]
}

const way = {
  girishAve: { label: 'Girish Avenue', query: 'Girish Ave, Shyam Bazar, Kolkata' },
  bagbazarSt: { label: 'Bagbazar Street', query: 'Bagbazar St, Baghbazar, Kolkata' },
  sovabazarSt: { label: 'Sovabazar Street', query: 'Sovabazar St, Shobhabazar, Kolkata' },
  bidhanSarani: { label: 'Bidhan Sarani', query: 'Bidhan Sarani, Hatibagan, Kolkata' },
  vivekanandaRd: { label: 'Vivekananda Road', query: 'Vivekananda Rd, Kolkata' },
  centralAve: { label: 'Central Avenue', query: 'Chittaranjan Ave, Machuabazar, Kolkata' },
  collegeSt: { label: 'College Street', query: 'College St, College Square, Kolkata' },
} satisfies Record<string, Waypoint>

export const STRETCHES: Stretch[] = [
  {
    id: 'riverside',
    title: 'Shyambazar and the riverside',
    stops: [
      {
        id: 'start',
        kind: 'start',
        name: 'Shyambazar Metro',
        bn: 'শ্যামবাজার মেট্রো',
        about: 'Meet at the station on the Blue Line, then head out together.',
        place: { query: 'Shyambazar Metro Station, Kolkata', placeId: 'ChIJ0zHayy92AjoRtLjjqT9XV1g', lat: 22.6011295, lng: 88.3715041 },
      },
      {
        id: 'shyam',
        kind: 'pandal',
        name: 'Shyam Square',
        bn: 'শ্যাম স্কোয়ার',
        about: 'The first darshan of the day, on Bidhan Sarani a few minutes from the metro.',
        place: { query: 'Shyam Square Sarbojanin Durgapuja, Kolkata', placeId: 'ChIJv1BXDgB3AjoRnb71jGgdf3E', lat: 22.6009447, lng: 88.3686733 },
        leg: {
          travel: 'walking',
          steps: [{ text: 'Walk from the metro', modes: ['walk'], minutes: 5, meters: 350 }],
        },
      },
      {
        id: 'bagbazar',
        kind: 'pandal',
        name: 'Bagbazar',
        bn: 'বাগবাজার',
        about: 'Over a hundred years old and still traditional, with a fair running alongside the pandal near the ghat.',
        place: { query: 'Baghbazar Sarbojanin Durgotsav & Exhibition, Kolkata', placeId: 'ChIJTyJDBAB3AjoR0qAGEUU_gis', lat: 22.6044897, lng: 88.365615 },
        leg: {
          travel: 'transit',
          steps: [
            { text: 'Walk to Girish Avenue', modes: ['walk'], minutes: 2, meters: 160, to: way.girishAve },
            { text: 'Bus to Bagbazar Street', modes: ['bus'], minutes: 5, to: way.bagbazarSt },
            { text: 'Walk to the pandal', modes: ['walk'], minutes: 5 },
          ],
        },
      },
      {
        id: 'jagat',
        kind: 'pandal',
        name: 'Jagat Mukherjee Park',
        bn: 'জগৎ মুখার্জি পার্ক',
        about: 'A park puja on Jatindra Mohan Avenue.',
        place: { query: 'Jagat Mukherjee Park, Kolkata', placeId: 'ChIJhxa3dTJ2AjoRZrV4-Aa0J9k', lat: 22.5994903, lng: 88.3660388 },
        leg: {
          travel: 'transit',
          steps: [
            { text: 'Walk back to Bagbazar Street', modes: ['walk'], minutes: 5, to: way.bagbazarSt },
            { text: 'Bus to Jagat Mukherjee Park', modes: ['bus'], minutes: 5 },
          ],
        },
      },
      {
        id: 'kumartuli',
        kind: 'pandal',
        name: 'Kumartuli',
        bn: 'কুমোরটুলি',
        about: 'The potters’ quarter where most of the city’s idols are made. The pandal is in Kumartuli Park.',
        place: { query: 'Kumartuli Park, Kolkata', placeId: 'ChIJ8ylvY813AjoRtwQLt6CGpHY', lat: 22.5989827, lng: 88.3614663 },
        leg: {
          travel: 'walking',
          steps: [{ text: 'Walk or take a toto', modes: ['walk', 'toto'], minutes: 9, meters: 650, estimated: true }],
        },
      },
    ],
  },
  {
    id: 'hatibagan',
    title: 'Hatibagan to Chorebagan',
    stops: [
      {
        id: 'hatibagan',
        kind: 'pandal',
        name: 'Hatibagan',
        bn: 'হাতিবাগান',
        about: 'North Kolkata’s shopping strip, with big theme pujas packed close together.',
        place: { query: 'Hatibagan Sarbojonin, Kolkata', placeId: 'ChIJQwTjsTB2AjoRx3tN6Flzg3g', lat: 22.5943863, lng: 88.3720004 },
        leg: {
          travel: 'driving',
          steps: [
            { text: 'Walk to Sovabazar Street', modes: ['walk'], minutes: 5, meters: 400, to: way.sovabazarSt },
            { text: 'Auto or bus to Hatibagan', modes: ['auto', 'bus'], minutes: 15, meters: 1000 },
          ],
        },
      },
      {
        id: 'kashibose',
        kind: 'pandal',
        name: 'Kashi Bose Lane',
        bn: 'কাশী বোস লেন',
        about: 'A narrow lane off Bidhan Sarani with one of the most talked-about theme pujas up north.',
        place: { query: 'Kashi Bose Lane Durga Puja Committee, Kolkata', placeId: 'ChIJG6Kr9DZ2AjoRRwVSsUBratU', lat: 22.5908979, lng: 88.3689174 },
        leg: {
          travel: 'driving',
          steps: [
            { text: 'Walk back to Bidhan Sarani', modes: ['walk'], minutes: 2, meters: 110, to: way.bidhanSarani },
            { text: 'Auto or bus to Kashi Bose Lane', modes: ['auto', 'bus'], minutes: 7, meters: 500 },
          ],
        },
      },
      {
        id: 'chaltabagan',
        kind: 'pandal',
        name: 'Chaltabagan',
        bn: 'চালতাবাগান',
        about: 'Chaltabagan Lohapatty, one of the busiest pujas in the north, just off Vivekananda Road.',
        place: { query: 'Maniktala Chaltabagan Lohapatty Durga Puja Committee, Kolkata', placeId: 'ChIJh0C7lJ53AjoRsOH0L60952Y', lat: 22.5848905, lng: 88.3721509 },
        leg: {
          travel: 'transit',
          steps: [
            { text: 'Walk back to Bidhan Sarani', modes: ['walk'], minutes: 2, to: way.bidhanSarani },
            { text: 'Bus or auto to Vivekananda Road', modes: ['bus', 'auto'], minutes: 10, meters: 800, to: way.vivekanandaRd },
            { text: 'Walk to the pandal', modes: ['walk'], minutes: 2 },
          ],
        },
      },
      {
        id: 'chorebagan',
        kind: 'pandal',
        name: 'Chorebagan',
        bn: 'চোরবাগান',
        about: 'A neighbourhood puja in the old lanes of Chorebagan, a short walk from Central Avenue.',
        place: { query: 'Chorebagan Sarbojanin Durgotsab Samity, Kolkata', placeId: 'ChIJvzq8MEt2AjoR-_hrcIj7UaQ', lat: 22.5834284, lng: 88.3635965 },
        leg: {
          travel: 'walking',
          steps: [
            {
              text: 'Walk',
              modes: ['walk'],
              minutes: [10, 15],
              meters: 750,
              or: { text: 'Book an auto', modes: ['auto'], minutes: 10 },
            },
          ],
        },
      },
    ],
  },
  {
    id: 'college',
    title: 'College Street to Sealdah',
    stops: [
      {
        id: 'mdali',
        kind: 'pandal',
        name: 'Muhammad Ali Park',
        bn: 'মহম্মদ আলি পার্ক',
        about: 'One of central Kolkata’s biggest crowd-pullers, known for large, elaborate pandals.',
        place: { query: 'Muhammad Ali Park, Kolkata', placeId: 'ChIJSU3OjLJ3AjoRCTbrrCz4wWQ', lat: 22.5771888, lng: 88.3607369 },
        leg: {
          travel: 'transit',
          steps: [
            { text: 'Walk to Central Avenue', modes: ['walk'], minutes: 3, meters: 250, to: way.centralAve },
            { text: 'Bus to Muhammad Ali Park', modes: ['bus'], minutes: 10 },
          ],
        },
      },
      {
        id: 'college',
        kind: 'pandal',
        name: 'College Square',
        bn: 'কলেজ স্কোয়ার',
        about: 'The lights reflect in the College Square pool, so it looks best after dark.',
        place: { query: 'College Square Durga Puja, Kolkata', placeId: 'ChIJLXe4Vfh3AjoRY7f-yRAe_es', lat: 22.5745279, lng: 88.3644724 },
        leg: {
          travel: 'walking',
          steps: [{ text: 'Walk', modes: ['walk'], minutes: 8, meters: 550 }],
        },
      },
      {
        id: 'santosh',
        kind: 'pandal',
        name: 'Santosh Mitra Square',
        bn: 'সন্তোষ মিত্র স্কোয়ার',
        about: 'Lebutala’s showstopper, known for grand themes and light shows.',
        place: { query: 'Santosh Mitra Square, Kolkata', placeId: 'ChIJM5YcpFV2AjoRC1j4yCx0MNI', lat: 22.5660201, lng: 88.3656532 },
        leg: {
          travel: 'driving',
          steps: [
            { text: 'Walk to College Street', modes: ['walk'], minutes: 5, meters: 280, to: way.collegeSt },
            { text: 'Auto to Santosh Mitra Square', modes: ['auto'], minutes: 15, meters: 1100 },
          ],
        },
      },
      {
        id: 'sealdah',
        kind: 'end',
        name: 'Sealdah Station',
        bn: 'শিয়ালদহ',
        about: 'End of the route. Metro and local trains leave from here.',
        place: { query: 'Sealdah Railway Station, Kolkata', placeId: 'ChIJVVVVxVl2AjoR0L9QGfqPlqM', lat: 22.567792, lng: 88.3710203 },
        leg: {
          travel: 'walking',
          steps: [{ text: 'Walk or take an auto', modes: ['walk', 'auto'], minutes: 12, meters: 800 }],
        },
      },
    ],
  },
  {
    id: 'after',
    title: 'After Sealdah',
    stops: [
      {
        id: 'tala',
        kind: 'optional',
        name: 'Tala Prattoy',
        bn: 'টালা প্রত্যয়',
        about: 'Optional. One of the city’s most celebrated art pujas, in Tala Park. Puja traffic can stretch the cab ride past an hour.',
        place: { query: 'Tala Prattoy Durga Puja Art, Kolkata', placeId: 'ChIJ4zt5ZgB3AjoR9nOLtRCiu6I', lat: 22.6087911, lng: 88.382502 },
        leg: {
          travel: 'driving',
          steps: [{ text: 'Cab to Tala Prattoy', modes: ['cab'], minutes: 75, meters: 5500 }],
        },
      },
      {
        id: 'home',
        kind: 'home',
        name: 'Home',
        bn: 'বাড়ি',
        about: 'Book a cab from wherever you finish. Save your address once and Directions goes straight there.',
        leg: {
          travel: 'driving',
          steps: [{ text: 'Cab home', modes: ['cab'] }],
        },
      },
    ],
  },
]

export const STOPS: Stop[] = STRETCHES.flatMap((s) => s.stops)

/** Stops on the main route, Shyambazar Metro to Sealdah. */
export const MAIN_STOPS: Stop[] = STOPS.filter((s) => s.kind === 'start' || s.kind === 'pandal' || s.kind === 'end')

export const PANDALS: Stop[] = STOPS.filter((s) => s.kind === 'pandal')

export function previousStop(id: string): Stop | undefined {
  const i = STOPS.findIndex((s) => s.id === id)
  return i > 0 ? STOPS[i - 1] : undefined
}

/** Display number for pandals (1–11), with Tala Prattoy continuing the count. */
export function pandalNumber(stop: Stop): number | undefined {
  if (stop.kind !== 'pandal' && stop.kind !== 'optional') return undefined
  return STOPS.filter((s) => s.kind === 'pandal' || s.kind === 'optional').indexOf(stop) + 1
}
