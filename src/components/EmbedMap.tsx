import { useState } from 'react'
import { useRouteModel } from '../data/model'
import type { Stop } from '../data/route'
import { embedPlaceUrl, embedRouteUrl } from '../lib/maps'

/** Keyless Google Maps embed, used when there's no API key or Google rejects it. */
export default function EmbedMap({ selected }: { selected: Stop }) {
  const model = useRouteModel()
  const [whole, setWhole] = useState(false)
  const prev = model.previous(selected.id)
  const showWhole = whole || !selected.place

  const places = model.main.flatMap((s) => (s.place ? [s.place] : []))
  let src = ''
  if (showWhole) src = places.length > 1 ? embedRouteUrl(places, 'walking') : places[0] ? embedPlaceUrl(places[0]) : ''
  else if (prev?.place && selected.place) src = embedRouteUrl([prev.place, selected.place], selected.leg?.travel ?? 'walking')
  else if (selected.place) src = embedPlaceUrl(selected.place)
  if (!src) return <div className="embed-map embed-empty">Add locations to this route’s stops to see them on the map.</div>

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
