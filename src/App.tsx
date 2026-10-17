import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Footer, Tips, Toast, ViewSwitch } from './components/Extras'
import { Hero } from './components/Hero'
import { MapPanel } from './components/MapPanel'
import { NextUpBar } from './components/NextUpBar'
import { Planner } from './components/Planner'
import { RouteList } from './components/RouteList'
import { PANDALS, STOPS } from './data/route'
import { findNext, seenCount } from './lib/routeState'
import { computeTimings, isDone, type Plan, type Progress } from './lib/time'
import { useMediaQuery } from './lib/useMediaQuery'
import { useStoredState } from './lib/useStoredState'

const KEY = 'thakur-dekha'
const LIVE_WINDOW = 18 * 60 * 60_000

function useNow(everyMs = 60_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), everyMs)
    return () => window.clearInterval(id)
  }, [everyMs])
  return now
}

export default function App() {
  const [progress, setProgress] = useStoredState<Progress>(`${KEY}:progress`, {})
  const [plan, setPlan] = useStoredState<Plan>(`${KEY}:plan`, { start: '16:00', dwell: 20 })
  const [home, setHome] = useStoredState<string>(`${KEY}:home`, '')
  const now = useNow()
  const wide = useMediaQuery('(min-width: 1024px)')

  const next = useMemo(() => findNext(progress), [progress])
  const nextId = next?.id
  const timings = useMemo(() => computeTimings(plan, progress, now), [plan, progress, now])
  const live = Object.values(progress).some((t) => t > 0 && now - t < LIVE_WINDOW)

  const [view, setView] = useState<'route' | 'map'>('route')
  // Once opened on mobile, the map stays mounted so switching back keeps its place
  // (and doesn't count as another Google map load).
  const [mapOpened, setMapOpened] = useState(false)
  if (view === 'map' && !mapOpened) setMapOpened(true)
  const [selectedId, setSelectedId] = useState(nextId ?? 'start')
  const [flickerId, setFlickerId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  // When the next stop moves on, follow it.
  const [followedNext, setFollowedNext] = useState(nextId)
  if (followedNext !== nextId) {
    setFollowedNext(nextId)
    if (nextId) setSelectedId(nextId)
  }

  const selected = STOPS.find((s) => s.id === selectedId) ?? STOPS[0]

  const notify = useCallback((message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 3200)
  }, [])

  const toggleDone = (id: string) => {
    const wasDone = isDone(progress, id)
    setProgress((p) => {
      const copy = { ...p }
      if ((copy[id] ?? 0) > 0) delete copy[id]
      else copy[id] = Date.now()
      return copy
    })
    if (!wasDone) {
      setFlickerId(id)
      window.setTimeout(() => setFlickerId((f) => (f === id ? null : f)), 1200)
    }
  }

  const toggleSkip = (id: string) =>
    setProgress((p) => {
      const copy = { ...p }
      if (copy[id] === 0) delete copy[id]
      else copy[id] = 0
      return copy
    })

  const reset = () => {
    if (!window.confirm('Clear every marked stop and start over?')) return
    setProgress({})
    setSelectedId('start')
  }

  const select = (id: string, fromMap = false) => {
    setSelectedId(id)
    if (fromMap && wide) {
      document.getElementById(`stop-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const changeView = (v: 'route' | 'map') => {
    setView(v)
    requestAnimationFrame(() => {
      if (v === 'route') {
        document.getElementById(`stop-${selectedId}`)?.scrollIntoView({ block: 'center' })
        return
      }
      // The switch itself is sticky, so measure from a plain marker just above it.
      const anchor = document.getElementById('view-anchor')
      if (anchor) window.scrollTo({ top: anchor.getBoundingClientRect().top + window.scrollY })
    })
  }

  const addHome = () => {
    setView('route')
    setSelectedId('home')
    requestAnimationFrame(() => document.getElementById('stop-home')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }

  const share = async () => {
    const url = window.location.origin + window.location.pathname
    const data = { title: 'Thakur Dekha: North Kolkata pandal route', text: 'Our Durga Puja route, Shyambazar to Sealdah', url }
    if (navigator.share) {
      try {
        await navigator.share(data)
      } catch {
        // Closing the share sheet isn't an error worth reporting.
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      notify('Link copied. Paste it in the group chat.')
    } catch {
      notify(url)
    }
  }

  const routeProps = {
    progress,
    nextId,
    selectedId,
    flickerId,
    timings,
    home,
    onHomeChange: setHome,
    onSelect: (id: string) => select(id),
    onToggleDone: toggleDone,
    onSkip: toggleSkip,
  }

  const mapProps = {
    selected,
    nextId,
    progress,
    timings,
    home,
    onHomeChange: setHome,
    onSelect: (id: string) => select(id, true),
    onToggleDone: toggleDone,
    onSkip: toggleSkip,
    onNotify: notify,
  }

  const showRoute = wide || view === 'route'

  return (
    <>
      <a className="skip-link" href="#route">
        Skip to the route
      </a>
      <main className="layout">
        <div className="col-route">
          <Hero progress={progress} nextId={nextId} onShare={share} />
          <Planner plan={plan} onChange={setPlan} timings={timings} live={live} />
          {!wide && <div id="view-anchor" />}
          {!wide && <ViewSwitch view={view} onChange={changeView} seen={seenCount(progress)} total={PANDALS.length} />}
          {showRoute && <RouteList {...routeProps} />}
          {!wide && mapOpened && (
            <div className="mobile-map" hidden={view !== 'map'}>
              <MapPanel {...mapProps} />
            </div>
          )}
          {!wide && view === 'route' && (
            <NextUpBar
              next={next}
              timing={nextId ? timings[nextId] : undefined}
              home={home}
              onToggleDone={toggleDone}
              onSkip={toggleSkip}
              onAddHome={addHome}
              onReset={reset}
            />
          )}
          <Tips />
          <Footer onReset={reset} />
        </div>
        {wide && (
          <aside className="col-map" aria-label="Map">
            <MapPanel {...mapProps} next={next} onSelectNext={() => nextId && select(nextId, true)} />
          </aside>
        )}
      </main>
      <Toast message={toast} />
    </>
  )
}
