import { useId, useState } from 'react'

interface Props {
  home: string
  onChange: (home: string) => void
}

export function HomeAddress({ home, onChange }: Props) {
  const [draft, setDraft] = useState(home)
  const [editing, setEditing] = useState(!home)
  const id = useId()

  if (home && !editing) {
    return (
      <p className="home-saved">
        Cab directions go to <strong>{home}</strong>.{' '}
        <button
          type="button"
          className="text-btn"
          onClick={() => {
            setDraft(home)
            setEditing(true)
          }}
        >
          Change
        </button>
      </p>
    )
  }

  return (
    <form
      className="home-form"
      onSubmit={(e) => {
        e.preventDefault()
        const value = draft.trim()
        if (!value) return
        onChange(value)
        setEditing(false)
      }}
    >
      <label htmlFor={id} className="field-label">
        Your home address, area or landmark
      </label>
      <span className="home-row">
        <input
          id={id}
          className="text-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. Dum Dum Park, Kolkata"
          autoComplete="street-address"
          enterKeyHint="done"
        />
        <button type="submit" className="btn" disabled={!draft.trim()}>
          Save
        </button>
      </span>
      <span className="hint">Saved on this phone only. Each of you can set your own.</span>
    </form>
  )
}
