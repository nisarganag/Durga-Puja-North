import { useCallback, useEffect, useState } from 'react'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

/**
 * useState that survives reloads and stays in sync across tabs. The key may change
 * (progress is stored per route); the value then switches to what's saved under the new key.
 */
export function useStoredState<T>(key: string, initial: T) {
  const [state, setState] = useState(() => ({ key, value: read(key, initial) }))

  let current = state
  if (state.key !== key) {
    current = { key, value: read(key, initial) }
    setState(current)
  }

  const setValue = useCallback((next: T | ((prev: T) => T)) => {
    setState((s) => ({ key: s.key, value: typeof next === 'function' ? (next as (prev: T) => T)(s.value) : next }))
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(current.key, JSON.stringify(current.value))
    } catch {
      // Private mode or storage full: the value just won't persist.
    }
  }, [current.key, current.value])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key || e.newValue === null) return
      try {
        setState({ key, value: JSON.parse(e.newValue) as T })
      } catch {
        // Ignore malformed values written by something else.
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  return [current.value, setValue] as const
}
