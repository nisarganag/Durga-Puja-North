import { useState } from 'react'
import { MAIN_STOPS, previousStop, type Stop } from '../data/route'
import { embedPlaceUrl, embedRouteUrl } from '../lib/maps'

/** Keyless Google Maps embed, used when there's no API key or Google rejects it. */
export default function EmbedMap({ selected }: { selected: Stop }) {
  const [whole, setWhole] = useState(false)
  const prev = previousStop(selected.id)
  const showWhole = whole || !selected.place

  let src: string
  if (showWhole) src = embedRouteUrl(MAIN_STOPS.flatMap((s) => (s.place ? [s.place] : [])), 'walking')
  else if (prev?.place && selected.place) src = embedRouteUrl([prev.place, selected.place], selected.leg?.travel ?? 'walking')
  else src = embedPlaceUrl(selected.place!)

  return (
    <div className="embed-map">
      <iframe
        key={src}
        src={src}
        title={showWhole ? 'The whole route on Google Maps' : `How to reach ${selected.name}, on Google Maps`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <div className="seg embed-toggle" role="group" aria-label="What the map shows">
        <button type="button" aria-pressed={!showWhole} onClick={() => setWhole(false)} disabled={!selected.place}>
          This stop
        </button>
        <button type="button" aria-pressed={showWhole} onClick={() => setWhole(true)}>
          Whole route
        </button>
      </div>
    </div>
  )
}
