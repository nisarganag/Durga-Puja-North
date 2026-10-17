import { useEffect, useRef } from 'react'
import { buildModel } from '../data/model'
import { DEFAULT_ROUTE, type Route } from '../data/route'
import { CheckIcon, PlusIcon } from './Icons'
import './RoutesDialog.css'

interface Props {
  open: boolean
  routes: Route[]
  activeId: string
  onClose: () => void
  onPick: (id: string) => void
  onNew: () => void
  onCopy: (route: Route) => void
  onEdit: (route: Route) => void
  onDelete: (route: Route) => void
}

function summary(route: Route): string {
  const { pandals, start, finish } = buildModel(route)
  const count = `${pandals.length} pandal${pandals.length === 1 ? '' : 's'}`
  return finish === start ? count : `${count}, ${start.name} to ${finish.name}`
}

export function RoutesDialog({ open, routes, activeId, onClose, onPick, onNew, onCopy, onEdit, onDelete }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={dialog}
      className="sheet"
      aria-labelledby="routes-title"
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && onClose()}
    >
      <div className="sheet-body">
        <h2 id="routes-title" className="sheet-title">
          Routes
        </h2>
        <p className="sheet-sub">Saved on this phone. Pick the one to follow, or make your own and share it.</p>

        <ul className="route-options">
          {[DEFAULT_ROUTE, ...routes].map((route) => {
            const active = route.id === activeId
            return (
              <li key={route.id} className={`route-option${active ? ' is-active' : ''}`}>
                <button type="button" className="route-pick" aria-pressed={active} onClick={() => onPick(route.id)}>
                  <span className="route-check" aria-hidden="true">
                    {active && <CheckIcon size={14} />}
                  </span>
                  <span className="route-pick-text">
                    <span className="route-pick-title">{route.title}</span>
                    <span className="route-pick-sub">
                      {summary(route)}
                      {route.builtIn ? '. Built in.' : '.'}
                    </span>
                  </span>
                </button>
                <span className="route-option-actions">
                  {route.builtIn ? (
                    <button type="button" className="text-btn" onClick={() => onCopy(route)}>
                      Copy and edit
                    </button>
                  ) : (
                    <>
                      <button type="button" className="text-btn" onClick={() => onEdit(route)}>
                        Edit
                      </button>
                      <button type="button" className="text-btn danger" onClick={() => onDelete(route)}>
                        Delete
                      </button>
                    </>
                  )}
                </span>
              </li>
            )
          })}
        </ul>

        <div className="sheet-actions">
          <button type="button" className="btn btn-primary" onClick={onNew}>
            <PlusIcon size={18} />
            Make a new route
          </button>
          <button type="button" className="btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </dialog>
  )
}
