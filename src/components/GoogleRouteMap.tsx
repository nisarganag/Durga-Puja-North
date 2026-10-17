import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { PATHS } from '../data/paths'
import { MAIN_STOPS, STOPS, type Stop } from '../data/route'
import { importMapLibraries, loadGoogleMaps, onMapsAuthFailure } from '../lib/googleMaps'
import { MAP_STYLE } from '../lib/mapStyle'
import { decodePolyline } from '../lib/polyline'
import { stopState } from '../lib/routeState'
import type { Progress } from '../lib/time'
import { Bulb } from './Bulb'
import { LocateIcon } from './Icons'

interface Props {
  selectedId: string
  nextId: string | undefined
  progress: Progress
  onSelect: (id: string) => void
  onFail: () => void
  onNotify: (message: string) => void
}

type LineState = 'lit' | 'live' | 'dim'

interface Positioned extends google.maps.OverlayView {
  setPosition: (p: google.maps.LatLngLiteral) => void
}

const COLORS = { marigold: '#ffb43a', sindoor: '#ef4a3a', haze: '#aaa4cc' }

/** An HTML element pinned to a map position, so markers can be ordinary React. */
function pinElement(Base: typeof google.maps.OverlayView, position: google.maps.LatLngLiteral, el: HTMLElement): Positioned {
  class Pinned extends Base {
    pos = position
    onAdd() {
      this.getPanes()?.overlayMouseTarget.appendChild(el)
    }
    draw() {
      const p = this.getProjection()?.fromLatLngToDivPixel(new google.maps.LatLng(this.pos))
      if (!p) return
      el.style.left = `${p.x}px`
      el.style.top = `${p.y}px`
    }
    onRemove() {
      el.remove()
    }
    setPosition(p: google.maps.LatLngLiteral) {
      this.pos = p
      this.draw()
    }
  }
  return new Pinned()
}

function lineStyle(state: LineState): { main: google.maps.PolylineOptions; glow: google.maps.PolylineOptions } {
  if (state === 'lit') {
    return {
      main: { strokeColor: COLORS.marigold, strokeOpacity: 1, strokeWeight: 4, icons: [], zIndex: 3 },
      glow: { strokeColor: COLORS.marigold, strokeOpacity: 0.22, strokeWeight: 14, zIndex: 2 },
    }
  }
  if (state === 'live') {
    return {
      main: {
        strokeOpacity: 0,
        icons: [{ icon: { path: 'M 0,-1 0,1', strokeColor: COLORS.sindoor, strokeOpacity: 1, strokeWeight: 4, scale: 2.5 }, offset: '0', repeat: '11px' }],
        zIndex: 4,
      },
      glow: { strokeColor: COLORS.sindoor, strokeOpacity: 0.16, strokeWeight: 12, zIndex: 2 },
    }
  }
  return {
    main: {
      strokeOpacity: 0,
      icons: [{ icon: { path: google.maps.SymbolPath.CIRCLE, fillColor: COLORS.haze, fillOpacity: 0.7, strokeOpacity: 0, scale: 1.6 }, offset: '0', repeat: '9px' }],
      zIndex: 1,
    },
    glow: { strokeOpacity: 0 },
  }
}

function legState(stop: Stop, progress: Progress, nextId: string | undefined): LineState {
  const s = stopState(stop, progress, nextId)
  if (s === 'done') return 'lit'
  if (s === 'next') return 'live'
  return 'dim'
}

export default function GoogleRouteMap({ selectedId, nextId, progress, onSelect, onFail, onNotify }: Props) {
  const canvas = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<{ stop: Stop; el: HTMLDivElement }[]>([])
  const lines = useRef<Record<string, { main: google.maps.Polyline; glow: google.maps.Polyline }>>({})
  const overlayBase = useRef<typeof google.maps.OverlayView | null>(null)
  const you = useRef<{ pin: Positioned; at: google.maps.LatLngLiteral } | null>(null)
  const watchId = useRef<number | null>(null)
  const [tracking, setTracking] = useState(false)
  const failRef = useRef(onFail)
  useEffect(() => {
    failRef.current = onFail
  }, [onFail])

  // Build the map once.
  useEffect(() => {
    let cancelled = false
    const offAuth = onMapsAuthFailure(() => failRef.current())

    loadGoogleMaps()
      .then(async () => {
        const [{ Map, Polyline, OverlayView }, { LatLngBounds }] = await importMapLibraries()
        if (cancelled || !canvas.current) return

        const m = new Map(canvas.current, {
          styles: MAP_STYLE,
          backgroundColor: '#15123a',
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
          center: { lat: 22.586, lng: 88.367 },
          zoom: 14,
        })

        const bounds = new LatLngBounds()
        MAIN_STOPS.forEach((s) => s.place && bounds.extend(s.place))
        m.fitBounds(bounds, { top: 48, right: 48, bottom: 200, left: 48 })

        for (const stop of STOPS) {
          const path = PATHS[stop.id]
          if (!path) continue
          const points = decodePolyline(path.polyline).map(([lat, lng]) => ({ lat, lng }))
          lines.current[stop.id] = {
            glow: new Polyline({ map: m, path: points, clickable: false }),
            main: new Polyline({ map: m, path: points, clickable: false }),
          }
        }

        const made: { stop: Stop; el: HTMLDivElement }[] = []
        for (const stop of STOPS) {
          if (!stop.place) continue
          const el = document.createElement('div')
          el.className = 'map-marker'
          OverlayView.preventMapHitsAndGesturesFrom(el)
          pinElement(OverlayView, stop.place, el).setMap(m)
          made.push({ stop, el })
        }

        overlayBase.current = OverlayView
        setMarkers(made)
        setMap(m)
      })
      .catch(() => {
        if (!cancelled) failRef.current()
      })

    return () => {
      cancelled = true
      offAuth()
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
    }
  }, [])

  // Light up the legs as stops get marked.
  useEffect(() => {
    if (!map) return
    for (const stop of STOPS) {
      const line = lines.current[stop.id]
      if (!line) continue
      const style = lineStyle(legState(stop, progress, nextId))
      line.main.setOptions(style.main)
      line.glow.setOptions(style.glow)
    }
  }, [map, progress, nextId])

  // Follow the selection, but leave the opening overview alone.
  const firstSelection = useRef(true)
  useEffect(() => {
    if (!map) return
    if (firstSelection.current) {
      firstSelection.current = false
      return
    }
    const stop = STOPS.find((s) => s.id === selectedId)
    if (!stop?.place) return
    map.panTo(stop.place)
    if ((map.getZoom() ?? 0) < 15) map.setZoom(16)
  }, [map, selectedId])

  const locate = () => {
    if (!map || !overlayBase.current) return
    // Already tracking, or still waiting for the first fix: never start a second watch.
    if (watchId.current !== null) {
      if (you.current) map.panTo(you.current.at)
      return
    }
    if (!('geolocation' in navigator)) {
      onNotify('This browser can’t share your location.')
      return
    }
    const Base = overlayBase.current
    let warned = false
    setTracking(true)
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const at = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        if (you.current) {
          you.current.at = at
          you.current.pin.setPosition(at)
          return
        }
        const el = document.createElement('div')
        el.className = 'you-dot'
        el.setAttribute('aria-label', 'You are here')
        const pin = pinElement(Base, at, el)
        pin.setMap(map)
        you.current = { pin, at }
        map.panTo(at)
        if ((map.getZoom() ?? 0) < 16) map.setZoom(16)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          onNotify('Location is blocked. Allow it in your browser settings to see yourself on the map.')
          if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
          watchId.current = null
          you.current?.pin.setMap(null)
          you.current = null
          setTracking(false)
          return
        }
        // Timeouts and lost signal are temporary: the watch keeps trying on its own.
        if (!you.current && !warned) {
          warned = true
          onNotify('Still looking for your location…')
        }
      },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 },
    )
  }

  return (
    <div className="gmap">
      <div ref={canvas} className="gmap-canvas" />
      {markers.map(({ stop, el }) =>
        createPortal(
          <button
            type="button"
            className={`marker-btn${stop.id === selectedId ? ' is-selected' : ''}`}
            onClick={() => onSelect(stop.id)}
            aria-label={stop.name}
          >
            <Bulb stop={stop} state={stopState(stop, progress, nextId)} size="sm" />
            {stop.id === selectedId && <span className="marker-label">{stop.name}</span>}
          </button>,
          el,
          stop.id,
        ),
      )}
      {map && (
        <button
          type="button"
          className={`map-fab${tracking ? ' is-on' : ''}`}
          onClick={locate}
          aria-label="Show where I am"
          aria-pressed={tracking}
        >
          <LocateIcon size={20} />
        </button>
      )}
    </div>
  )
}
