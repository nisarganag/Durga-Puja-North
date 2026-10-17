import { ListIcon, MapIcon } from './Icons'
import './Extras.css'

const TIPS = [
  {
    title: 'Carry cash in small notes',
    body: 'Autos, totos and buses run on change, and UPI can stall when a crowd jams the network.',
  },
  {
    title: 'Agree on a regroup spot',
    body: 'Pick a landmark at every pandal entrance in case someone drifts off in the crowd.',
  },
  {
    title: 'Expect queues at the big ones',
    body: 'The famous pujas get long lines after dark. Add time per pandal in the planner if it’s getting slow.',
  },
  {
    title: 'Charge up before you leave',
    body: 'Navigation drains the battery fast. Bring a power bank, and water.',
  },
]

export function Tips() {
  return (
    <section className="tips" aria-labelledby="tips-title">
      <h2 id="tips-title">Before you head out</h2>
      <ul className="tips-list">
        {TIPS.map((t) => (
          <li key={t.title}>
            <h3>{t.title}</h3>
            <p>{t.body}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function Footer({ onReset }: { onReset: () => void }) {
  return (
    <footer className="footer">
      <p className="footer-bn" lang="bn">
        শুভ শারদীয়া
      </p>
      <p>For our Pujo, 2026. Times are estimates; the crowds decide the rest.</p>
      <p className="footer-credits">Maps and directions by Google Maps. Street paths © OpenStreetMap contributors.</p>
      <p>
        <button type="button" className="text-btn" onClick={onReset}>
          Clear progress and start over
        </button>
      </p>
      <p className="footer-sign">
        Made by Nisarga with{' '}
        <span role="img" aria-label="love">
          ❤️
        </span>
      </p>
    </footer>
  )
}

export function ViewSwitch({ view, onChange, seen, total }: { view: 'route' | 'map'; onChange: (v: 'route' | 'map') => void; seen: number; total: number }) {
  return (
    <div className="view-switch" id="view-switch">
      <div className="seg" role="group" aria-label="Show">
        <button type="button" aria-pressed={view === 'route'} onClick={() => onChange('route')}>
          <ListIcon size={16} />
          Route
        </button>
        <button type="button" aria-pressed={view === 'map'} onClick={() => onChange('map')}>
          <MapIcon size={16} />
          Map
        </button>
      </div>
      <span className="view-progress">
        {seen} of {total} seen
      </span>
    </div>
  )
}

export function Toast({ message }: { message: string | null }) {
  return (
    <div className={`toast${message ? ' is-on' : ''}`} role="status" aria-live="polite">
      {message}
    </div>
  )
}
