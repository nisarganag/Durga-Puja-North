import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Footer, Tips, Toast, ViewSwitch } from './components/Extras'
import { Hero } from './components/Hero'
import { MapPanel } from './components/MapPanel'
import { NextUpBar } from './components/NextUpBar'
import { Planner } from './components/Planner'
import { RouteEditor } from './components/RouteEditor'
import { RouteList } from './components/RouteList'
import { RoutesDialog } from './components/RoutesDialog'
import { buildModel, RouteProvider } from './data/model'
import { DEFAULT_ROUTE, type Route } from './data/route'
import { findNext, seenCount } from './lib/routeState'
import { blankRoute, copyRoute, decodeRoute, DEFAULT_ID, encodeRoute, progressKey } from './lib/routes'
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
  const [routes, setRoutes] = useStoredState<Route[]>(`${KEY}:routes`, [])
  const [activeId, setActiveId] = useStoredState<string>(`${KEY}:active-route`, DEFAULT_ID)
  const route = useMemo(() => routes.find((r) => r.id === activeId) ?? DEFAULT_ROUTE, [routes, activeId])
  const model = useMemo(() => buildModel(route), [route])
  // Changes whenever the route or its contents change, so the map redraws.
  const routeKey = `${route.id}:${route.updatedAt ?? 0}`

  const [progress, setProgress] = useStoredState<Progress>(progressKey(route.id), {})
  const [plan, setPlan] = useStoredState<Plan>(`${KEY}:plan`, { start: '16:00', dwell: 20 })
  const [home, setHome] = useStoredState<string>(`${KEY}:home`, '')
  const now = useNow()
  const wide = useMediaQuery('(min-width: 1024px)')

  const next = useMemo(() => findNext(model.stops, progress), [model, progress])
  const nextId = next?.id
  const timings = useMemo(() => computeTimings(model.stops, plan, progress, now), [model, plan, progress, now])
  const live = Object.values(progress).some((t) => t > 0 && now - t < LIVE_WINDOW)

  const [view, setView] = useState<'route' | 'map'>('route')
  // Once opened on mobile, the map stays mounted so switching back keeps its place
  // (and doesn't count as another Google map load).
  const [mapOpened, setMapOpened] = useState(false)
  if (view === 'map' && !mapOpened) setMapOpened(true)
  const [selectedId, setSelectedId] = useState(nextId ?? model.start.id)
  const [flickerId, setFlickerId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)
  const [routesOpen, setRoutesOpen] = useState(false)
  const [editing, setEditing] = useState<{ route: Route; isNew: boolean } | null>(null)

  // When the next stop moves on, or another route is opened, follow it.
  const followKey = `${routeKey}|${nextId}`
  const [followed, setFollowed] = useState(followKey)
  if (followed !== followKey) {
    setFollowed(followKey)
    setSelectedId(nextId ?? model.start.id)
  }

  const selected = model.stops.find((s) => s.id === selectedId) ?? next ?? model.start

  const notify = useCallback((message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 3600)
  }, [])

  // Someone opened a shared route link: save the route on this phone and switch to it.
  // Also handles a link tapped while the site is already open, which only changes the hash.
  useEffect(() => {
    let current = true
    const importFromHash = () => {
      const match = window.location.hash.match(/^#r=([\w-]+)$/)
      if (!match) return
      decodeRoute(match[1]).then((incoming) => {
        if (!current) return
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
        if (!incoming) {
          notify('That route link looks broken. Ask for it again.')
          return
        }
        setRoutes((list) => [...list.filter((r) => r.id !== incoming.id), incoming])
        setActiveId(incoming.id)
        setEditing(null)
        window.scrollTo({ top: 0 })
        notify(`Opened “${incoming.title}”. It’s saved on this phone now.`)
      })
    }
    importFromHash()
    window.addEventListener('hashchange', importFromHash)
    return () => {
      current = false
      window.removeEventListener('hashchange', importFromHash)
    }
  }, [notify, setRoutes, setActiveId])

  useEffect(() => {
    document.title = route.builtIn ? 'Thakur Dekha: North Kolkata pandal route' : `${route.title} | Thakur Dekha`
  }, [route])

  // Custom routes travel inside the share link. Encode ahead of time so tapping Share
  // opens the share sheet straight away (browsers only allow it right after a tap).
  const [shareCode, setShareCode] = useState<{ key: string; code: string } | null>(null)
  useEffect(() => {
    if (route.builtIn) return
    let current = true
    encodeRoute(route).then((code) => current && setShareCode({ key: routeKey, code }))
    return () => {
      current = false
    }
  }, [route, routeKey])

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
    setSelectedId(model.start.id)
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
    const homeStop = model.stops.find((s) => s.kind === 'home')
    if (!homeStop) return
    setView('route')
    setSelectedId(homeStop.id)
    requestAnimationFrame(() => document.getElementById(`stop-${homeStop.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }

  const share = async () => {
    let url = window.location.origin + window.location.pathname
    if (!route.builtIn) url += `#r=${shareCode?.key === routeKey ? shareCode.code : await encodeRoute(route)}`
    const data = {
      title: route.builtIn ? 'Thakur Dekha: North Kolkata pandal route' : `${route.title} | Thakur Dekha`,
      text: route.builtIn ? 'Our Durga Puja route, Shyambazar to Sealdah' : `Our Durga Puja route: ${route.title}`,
      url,
    }
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
      notify(route.builtIn ? 'Link copied. Paste it in the group chat.' : 'Link copied. Anyone who opens it gets this route.')
    } catch {
      notify('Couldn’t copy the link. Copy it from the address bar instead.')
    }
  }

  const pickRoute = (id: string) => {
    setActiveId(id)
    setRoutesOpen(false)
    window.scrollTo({ top: 0 })
  }

  const saveRoute = (saved: Route) => {
    setRoutes((list) => (list.some((r) => r.id === saved.id) ? list.map((r) => (r.id === saved.id ? saved : r)) : [...list, saved]))
    setActiveId(saved.id)
    setEditing(null)
    window.scrollTo({ top: 0 })
    notify(`Saved “${saved.title}”. Share it from the top of the page.`)
  }

  const deleteRoute = (doomed: Route) => {
    if (!window.confirm(`Delete “${doomed.title}” from this phone?`)) return
    setRoutes((list) => list.filter((r) => r.id !== doomed.id))
    try {
      localStorage.removeItem(progressKey(doomed.id))
    } catch {
      // Nothing to clean up if storage is unavailable.
    }
    if (activeId === doomed.id) setActiveId(DEFAULT_ID)
  }

  const openEditor = (target: Route, isNew: boolean) => {
    setRoutesOpen(false)
    setEditing({ route: target, isNew })
  }

  const routeProps = {
    progress,
    nextId,
    selectedId: selected.id,
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

  if (editing) {
    return (
      <>
        <main className="layout layout-editor">
          <RouteEditor
            key={editing.route.id}
            initial={editing.route}
            isNew={editing.isNew}
            onSave={saveRoute}
            onCancel={() => setEditing(null)}
          />
        </main>
        <Toast message={toast} />
      </>
    )
  }

  return (
    <RouteProvider value={model}>
      <a className="skip-link" href="#route">
        Skip to the route
      </a>
      <main className="layout">
        <div className="col-route">
          <Hero
            progress={progress}
            nextId={nextId}
            onShare={share}
            onOpenRoutes={() => setRoutesOpen(true)}
            hasOwnRoutes={routes.length > 0}
          />
          <Planner plan={plan} onChange={setPlan} timings={timings} live={live} />
          {!wide && <div id="view-anchor" />}
          {!wide && <ViewSwitch view={view} onChange={changeView} seen={seenCount(model.pandals, progress)} total={model.pandals.length} />}
          {showRoute && <RouteList {...routeProps} />}
          {!wide && mapOpened && (
            <div className="mobile-map" hidden={view !== 'map'}>
              <MapPanel key={routeKey} {...mapProps} />
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
            <MapPanel key={routeKey} {...mapProps} next={next} onSelectNext={() => nextId && select(nextId, true)} />
          </aside>
        )}
      </main>
      <RoutesDialog
        open={routesOpen}
        routes={routes}
        activeId={route.id}
        onClose={() => setRoutesOpen(false)}
        onPick={pickRoute}
        onNew={() => openEditor(blankRoute(), true)}
        onCopy={(r) => openEditor(copyRoute(r), true)}
        onEdit={(r) => openEditor(r, false)}
        onDelete={deleteRoute}
      />
      <Toast message={toast} />
    </RouteProvider>
  )
}
