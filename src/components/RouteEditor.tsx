import { useEffect, useId, useRef, useState } from 'react'
import type { Mode, Place, Route, Step, StopKind, Waypoint } from '../data/route'
import { hasMapsKey, loadGoogleMaps } from '../lib/googleMaps'
import { modeWords } from '../lib/routeState'
import { newId, normalizeStops, travelFor } from '../lib/routes'
import { ArrowDownIcon, ArrowUpIcon, HomeIcon, LocateIcon, ModeIcon, PlusIcon, TrashIcon } from './Icons'
import './RouteEditor.css'

// The editor works on a draft with plain text fields (so "10-15" can be typed freely),
// and turns it back into a route, with checks, on save.

interface DraftStep {
  text: string
  modes: Mode[]
  minutes: string
  meters: string
  to?: Waypoint
}

interface DraftStop {
  id: string
  kind: StopKind
  name: string
  bn: string
  about: string
  place?: Place
  steps: DraftStep[]
}

interface Draft {
  id: string
  title: string
  stops: DraftStop[]
}

const MODES: { mode: Mode; label: string }[] = [
  { mode: 'walk', label: 'Walk' },
  { mode: 'bus', label: 'Bus' },
  { mode: 'auto', label: 'Auto' },
  { mode: 'toto', label: 'Toto' },
  { mode: 'cab', label: 'Cab' },
  { mode: 'metro', label: 'Metro' },
]

const KINDS: { kind: StopKind; label: string }[] = [
  { kind: 'pandal', label: 'Pandal' },
  { kind: 'optional', label: 'Optional pandal' },
  { kind: 'end', label: 'Station or meeting point' },
  { kind: 'home', label: 'Home' },
]

const KOLKATA = { south: 22.45, west: 88.25, north: 22.72, east: 88.5 }

const blankStep = (): DraftStep => ({ text: '', modes: ['walk'], minutes: '', meters: '' })

function toDraft(route: Route): Draft {
  return {
    id: route.id,
    title: route.title,
    stops: route.stops.map((s) => ({
      id: s.id,
      kind: s.kind,
      name: s.name,
      bn: s.bn,
      about: s.about,
      place: s.place,
      steps: (s.leg?.steps ?? []).map((st) => ({
        // The editor has no separate "or" field, so fold the alternative into the text.
        text: st.or ? `${st.text}, or ${st.or.text.toLowerCase()}${st.or.minutes !== undefined ? ` (${st.or.minutes} min)` : ''}` : st.text,
        modes: st.or ? [...st.modes, ...st.or.modes.filter((m) => !st.modes.includes(m))] : st.modes,
        minutes: st.minutes === undefined ? '' : Array.isArray(st.minutes) ? `${st.minutes[0]}-${st.minutes[1]}` : String(st.minutes),
        meters: st.meters === undefined ? '' : String(st.meters),
        to: st.to,
      })),
    })),
  }
}

function parseMinutes(text: string): number | [number, number] | undefined | null {
  const t = text.trim()
  if (!t) return undefined
  const range = t.match(/^(\d{1,3})\s*(?:-|–|to)\s*(\d{1,3})$/i)
  if (range) {
    const [a, b] = [Number(range[1]), Number(range[2])]
    return a === b ? a : [Math.min(a, b), Math.max(a, b)]
  }
  return /^\d{1,3}$/.test(t) ? Number(t) : null
}

function parseMeters(text: string): number | undefined | null {
  const t = text.trim().toLowerCase()
  if (!t) return undefined
  const m = t.match(/^(\d+(?:\.\d+)?)\s*(m|km|metres?|meters?)?$/)
  if (!m) return null
  const value = Number(m[1]) * (m[2] === 'km' ? 1000 : 1)
  return value < 100_000 ? Math.round(value) : null
}

function fromDraft(draft: Draft): { route?: Route; errors: string[] } {
  const errors: string[] = []
  if (!draft.title.trim()) errors.push('Give the route a name.')
  if (draft.stops.length < 2) errors.push('Add at least one stop after the start.')

  const stops = draft.stops.map((s, i) => {
    const label = s.name.trim() || `Stop ${i + 1}`
    if (!s.name.trim()) errors.push(`Stop ${i + 1} needs a name.`)
    if (s.kind !== 'home' && !s.place?.query.trim()) errors.push(`Add a location for ${label}.`)
    const steps: Step[] = i === 0 ? [] : s.steps.map((st) => {
      const minutes = parseMinutes(st.minutes)
      const meters = parseMeters(st.meters)
      if (minutes === null) errors.push(`Check the minutes for ${label}: use a number like 5, or a range like 10-15.`)
      if (meters === null) errors.push(`Check the distance for ${label}: use metres like 350, or kilometres like 1.2 km.`)
      const words = modeWords(st.modes)
      const text = st.text.trim() || words.charAt(0).toUpperCase() + words.slice(1)
      const step: Step = { text, modes: st.modes }
      if (minutes != null) step.minutes = minutes
      if (meters != null) step.meters = meters
      if (st.to && text.includes(st.to.label)) step.to = st.to
      return step
    })
    return {
      id: s.id,
      kind: s.kind,
      name: s.name.trim(),
      bn: s.bn.trim(),
      about: s.about.trim(),
      place: s.place,
      leg: i === 0 ? undefined : { steps, travel: travelFor(steps) },
    }
  })

  if (errors.length) return { errors: [...new Set(errors)] }
  return { route: { id: draft.id, title: draft.title.trim(), stops: normalizeStops(stops), updatedAt: Date.now() }, errors }
}

/** Same rules as saved routes, applied while editing so the form always makes sense. */
function tidy(stops: DraftStop[]): DraftStop[] {
  return stops.map((s, i) => {
    if (i === 0) return { ...s, kind: 'start' }
    let kind = s.kind
    if (kind === 'start' || (kind === 'home' && i !== stops.length - 1)) kind = 'pandal'
    return { ...s, kind, steps: s.steps.length || kind === 'home' ? s.steps : [blankStep()] }
  })
}

interface Props {
  initial: Route
  isNew: boolean
  onSave: (route: Route) => void
  onCancel: () => void
}

export function RouteEditor({ initial, isNew, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial))
  const [openId, setOpenId] = useState<string | null>(() => initial.stops.find((s) => !s.name)?.id ?? null)
  const [errors, setErrors] = useState<string[]>([])
  const startingPoint = useRef(JSON.stringify(toDraft(initial)))
  const errorBox = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const setStops = (update: (stops: DraftStop[]) => DraftStop[]) => setDraft((d) => ({ ...d, stops: tidy(update(d.stops)) }))
  const patchStop = (id: string, patch: Partial<DraftStop>) => setStops((stops) => stops.map((s) => (s.id === id ? { ...s, ...patch } : s)))

  const move = (index: number, delta: number) =>
    setStops((stops) => {
      const copy = [...stops]
      const [stop] = copy.splice(index, 1)
      copy.splice(index + delta, 0, stop)
      return copy
    })

  const addStop = () => {
    const stop: DraftStop = { id: newId(), kind: 'pandal', name: '', bn: '', about: '', steps: [blankStep()] }
    setStops((stops) => {
      const last = stops[stops.length - 1]
      return last?.kind === 'home' ? [...stops.slice(0, -1), stop, last] : [...stops, stop]
    })
    setOpenId(stop.id)
  }

  const removeStop = (id: string) => setStops((stops) => stops.filter((s) => s.id !== id))

  const save = () => {
    const result = fromDraft(draft)
    if (!result.route) {
      setErrors(result.errors)
      requestAnimationFrame(() => errorBox.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
      return
    }
    onSave(result.route)
  }

  const cancel = () => {
    if (JSON.stringify(draft) !== startingPoint.current && !window.confirm('Discard your changes to this route?')) return
    onCancel()
  }

  return (
    <section className="editor" aria-labelledby="editor-title">
      <div className="editor-bar">
        <button type="button" className="text-btn" onClick={cancel}>
          Cancel
        </button>
        <h2 id="editor-title">{isNew ? 'New route' : 'Edit route'}</h2>
        <button type="button" className="btn btn-primary" onClick={save}>
          Save
        </button>
      </div>

      <label className="field editor-title-field">
        <span className="field-label">Route name</span>
        <input
          className="text-input"
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          placeholder="e.g. South Kolkata, pandal by pandal"
          maxLength={120}
        />
      </label>
      <p className="editor-intro">
        Start with where everyone meets, then add each pandal in the order you'll visit. For every stop, add the steps to
        get there from the one before: walk, bus, auto, and so on.
      </p>

      {errors.length > 0 && (
        <div className="editor-errors" role="alert" ref={errorBox}>
          <p>Fix these to save:</p>
          <ul>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <ol className="editor-stops">
        {draft.stops.map((stop, i) => (
          <StopCard
            key={stop.id}
            stop={stop}
            index={i}
            count={draft.stops.length}
            number={draft.stops.slice(0, i + 1).filter((s) => s.kind === 'pandal' || s.kind === 'optional').length}
            previousName={draft.stops[i - 1]?.name}
            open={openId === stop.id}
            onToggle={() => setOpenId(openId === stop.id ? null : stop.id)}
            onChange={(patch) => patchStop(stop.id, patch)}
            onMove={(delta) => move(i, delta)}
            onRemove={() => removeStop(stop.id)}
          />
        ))}
      </ol>

      <button type="button" className="btn editor-add" onClick={addStop}>
        <PlusIcon size={18} />
        Add a stop
      </button>
    </section>
  )
}

interface StopCardProps {
  stop: DraftStop
  index: number
  count: number
  number: number
  previousName?: string
  open: boolean
  onToggle: () => void
  onChange: (patch: Partial<DraftStop>) => void
  onMove: (delta: number) => void
  onRemove: () => void
}

function StopCard({ stop, index, count, number, previousName, open, onToggle, onChange, onMove, onRemove }: StopCardProps) {
  const id = useId()
  const isStart = index === 0
  const isLast = index === count - 1
  const kindLabel = isStart ? 'Starting point' : KINDS.find((k) => k.kind === stop.kind)?.label
  const where = stop.kind === 'home' ? 'Uses your saved home address' : stop.place?.placeId || stop.place?.lat !== undefined ? 'Pinned on the map' : stop.place?.query ? 'Google Maps search' : 'No location yet'
  const numbered = stop.kind === 'pandal' || stop.kind === 'optional'

  return (
    <li className={`ed-stop${open ? ' is-open' : ''}`}>
      <button type="button" className="ed-stop-head" aria-expanded={open} aria-controls={`${id}-body`} onClick={onToggle}>
        <span className={`ed-badge kind-${stop.kind}`} aria-hidden="true">
          {isStart ? 'S' : numbered ? number : stop.kind === 'home' ? <HomeIcon size={14} /> : '•'}
        </span>
        <span className="ed-head-text">
          <span className="ed-name">{stop.name || (isStart ? 'Where you meet' : 'New stop')}</span>
          <span className="ed-meta">
            {kindLabel}. {where}.
          </span>
        </span>
      </button>

      {open && (
        <div className="ed-body" id={`${id}-body`}>
          {!isStart && (
            <div className="field">
              <span className="field-label" id={`${id}-kind`}>
                What kind of stop
              </span>
              <span className="ed-kinds" role="radiogroup" aria-labelledby={`${id}-kind`}>
                {KINDS.filter((k) => k.kind !== 'home' || isLast).map((k) => (
                  <button
                    key={k.kind}
                    type="button"
                    role="radio"
                    aria-checked={stop.kind === k.kind}
                    onClick={() => onChange({ kind: k.kind, place: k.kind === 'home' ? undefined : stop.place })}
                  >
                    {k.label}
                  </button>
                ))}
              </span>
            </div>
          )}

          <span className="ed-row">
            <label className="field">
              <span className="field-label">Name</span>
              <input
                className="text-input"
                value={stop.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder={isStart ? 'e.g. Kalighat Metro' : 'e.g. Suruchi Sangha'}
                maxLength={120}
              />
            </label>
            <label className="field">
              <span className="field-label">Bengali name (optional)</span>
              <input className="text-input" lang="bn" value={stop.bn} onChange={(e) => onChange({ bn: e.target.value })} maxLength={120} />
            </label>
          </span>

          {stop.kind !== 'home' && <PlaceField place={stop.place} onChange={(place) => onChange({ place })} />}

          <label className="field">
            <span className="field-label">Note (optional)</span>
            <textarea
              className="text-input ed-note"
              value={stop.about}
              onChange={(e) => onChange({ about: e.target.value })}
              placeholder="What’s special here, or a tip for the group"
              maxLength={400}
              rows={2}
            />
          </label>

          {!isStart && <StepsEditor steps={stop.steps} fromName={previousName} onChange={(steps) => onChange({ steps })} />}

          <span className="ed-stop-actions">
            <button type="button" className="btn" onClick={() => onMove(-1)} disabled={index === 0}>
              <ArrowUpIcon size={16} />
              Move up
            </button>
            <button type="button" className="btn" onClick={() => onMove(1)} disabled={isLast}>
              <ArrowDownIcon size={16} />
              Move down
            </button>
            <button type="button" className="btn ed-delete" onClick={onRemove} disabled={count <= 2}>
              <TrashIcon size={16} />
              Delete
            </button>
          </span>
        </div>
      )}
    </li>
  )
}

/**
 * Location search. With a Google Maps key it suggests real places and pins the exact one;
 * without, whatever is typed becomes a Google Maps search when someone taps the link.
 */
function PlaceField({ place, onChange }: { place?: Place; onChange: (place?: Place) => void }) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [text, setText] = useState(place?.query ?? '')
  const [suggesting, setSuggesting] = useState(false)
  const [locating, setLocating] = useState(false)
  const latest = useRef(onChange)
  useEffect(() => {
    latest.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!hasMapsKey()) return
    let cancelled = false
    let listener: google.maps.MapsEventListener | undefined
    loadGoogleMaps()
      .then(() => google.maps.importLibrary('places') as Promise<google.maps.PlacesLibrary>)
      .then(({ Autocomplete }) => {
        if (cancelled || !input.current) return
        const autocomplete = new Autocomplete(input.current, {
          fields: ['place_id', 'geometry', 'name', 'formatted_address'],
          bounds: KOLKATA,
          strictBounds: false,
        })
        listener = autocomplete.addListener('place_changed', () => {
          const p = autocomplete.getPlace()
          const loc = p.geometry?.location
          if (!loc) return
          const address = p.formatted_address ?? ''
          const query = p.name && !address.startsWith(p.name) ? [p.name, address].filter(Boolean).join(', ') : address || p.name || ''
          setText(p.name ?? query)
          latest.current({ query, placeId: p.place_id, lat: loc.lat(), lng: loc.lng() })
        })
        setSuggesting(true)
      })
      .catch(() => {
        // No suggestions; typing a name still works.
      })
    return () => {
      cancelled = true
      listener?.remove()
    }
  }, [])

  const useHere = () => {
    if (!('geolocation' in navigator)) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setText('Where I am now')
        latest.current({ query: `${lat.toFixed(6)},${lng.toFixed(6)}`, lat, lng })
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 15_000 },
    )
  }

  const pinned = Boolean(place?.placeId || place?.lat !== undefined)

  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        Location
      </label>
      <input
        id={id}
        ref={input}
        className="text-input"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          onChange(e.target.value.trim() ? { query: e.target.value } : undefined)
        }}
        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
        placeholder={suggesting ? 'Search Google Maps' : 'Name and area, e.g. Suruchi Sangha, New Alipore'}
        autoComplete="off"
      />
      <span className="ed-place-hint">
        <span className={`hint${pinned ? ' is-ok' : ''}`}>
          {pinned
            ? 'Pinned on the map.'
            : place?.query
              ? suggesting
                ? 'Pick a suggestion to pin the exact place.'
                : 'Opens as a Google Maps search.'
              : suggesting
                ? 'Start typing and pick a suggestion.'
                : 'Type the name and area as you’d search Google Maps.'}
        </span>
        <button type="button" className="text-btn" onClick={useHere} disabled={locating}>
          <LocateIcon size={14} />
          {locating ? 'Finding you…' : 'Use where I am now'}
        </button>
      </span>
    </div>
  )
}

function StepsEditor({ steps, fromName, onChange }: { steps: DraftStep[]; fromName?: string; onChange: (steps: DraftStep[]) => void }) {
  const set = (i: number, patch: Partial<DraftStep>) => onChange(steps.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  const toggleMode = (i: number, mode: Mode) => {
    const modes = steps[i].modes
    if (modes.includes(mode)) {
      if (modes.length > 1) set(i, { modes: modes.filter((m) => m !== mode) })
    } else {
      set(i, { modes: [...modes, mode] })
    }
  }

  return (
    <fieldset className="ed-steps">
      <legend className="field-label">Getting here from {fromName?.trim() || 'the previous stop'}</legend>
      {steps.map((step, i) => (
        <div key={i} className="ed-step">
          <span className="ed-modes" role="group" aria-label={`Step ${i + 1}: how`}>
            {MODES.map(({ mode, label }) => (
              <button key={mode} type="button" aria-pressed={step.modes.includes(mode)} onClick={() => toggleMode(i, mode)}>
                <ModeIcon mode={mode} size={16} />
                {label}
              </button>
            ))}
          </span>
          <input
            className="text-input"
            value={step.text}
            onChange={(e) => set(i, { text: e.target.value })}
            placeholder="What to do, e.g. Walk to Girish Avenue"
            aria-label={`Step ${i + 1}: what to do`}
            maxLength={160}
          />
          <span className="ed-step-numbers">
            <label className="field">
              <span className="field-label">Minutes</span>
              <input
                className="text-input"
                value={step.minutes}
                onChange={(e) => set(i, { minutes: e.target.value })}
                placeholder="5 or 10-15"
                inputMode="text"
              />
            </label>
            <label className="field">
              <span className="field-label">Distance</span>
              <input
                className="text-input"
                value={step.meters}
                onChange={(e) => set(i, { meters: e.target.value })}
                placeholder="350 or 1.2 km"
                inputMode="decimal"
              />
            </label>
            <button
              type="button"
              className="ed-icon-btn"
              onClick={() => onChange(steps.filter((_, j) => j !== i))}
              aria-label={`Remove step ${i + 1}`}
            >
              <TrashIcon size={16} />
            </button>
          </span>
        </div>
      ))}
      <button type="button" className="text-btn" onClick={() => onChange([...steps, blankStep()])}>
        <PlusIcon size={16} />
        Add a step
      </button>
    </fieldset>
  )
}
