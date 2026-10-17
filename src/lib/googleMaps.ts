// Loads the Google Maps JavaScript API once, and reports when the key is rejected
// (invalid, restricted to another site, billing off) so the page can switch to
// the keyless embed instead of showing Google's grey error map.

const KEY: string | undefined = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || undefined
const CALLBACK = '__pujaMapsReady'
const TIMEOUT_MS = 15_000

let loading: Promise<void> | null = null
let script: HTMLScriptElement | null = null
let authFailed = false
const failureListeners = new Set<() => void>()

declare global {
  interface Window {
    gm_authFailure?: () => void
    [CALLBACK]?: () => void
  }
}

export function hasMapsKey(): boolean {
  return Boolean(KEY) && !authFailed
}

/** Google calls window.gm_authFailure when it rejects the key, sometimes after the map has drawn. */
export function onMapsAuthFailure(listener: () => void): () => void {
  if (authFailed) listener()
  failureListeners.add(listener)
  return () => failureListeners.delete(listener)
}

export function loadGoogleMaps(): Promise<void> {
  if (!KEY) return Promise.reject(new Error('No Google Maps key configured'))
  if (authFailed) return Promise.reject(new Error('Google Maps key was rejected'))
  if (loading) return loading

  loading = new Promise<void>((resolve, reject) => {
    // A script from an earlier attempt that timed out may have finished loading since.
    if (typeof window.google?.maps?.importLibrary === 'function') {
      resolve()
      return
    }

    const timer = window.setTimeout(() => reject(new Error('Google Maps took too long to load')), TIMEOUT_MS)

    window.gm_authFailure = () => {
      authFailed = true
      reject(new Error('Google Maps key was rejected'))
      failureListeners.forEach((l) => l())
    }
    window[CALLBACK] = () => {
      window.clearTimeout(timer)
      resolve()
    }

    const onError = () => {
      window.clearTimeout(timer)
      script?.remove()
      script = null
      reject(new Error('Could not reach Google Maps'))
    }

    // Still downloading from an earlier attempt: wait for it rather than adding a second copy.
    if (script) {
      script.onerror = onError
      return
    }

    const params = new URLSearchParams({ key: KEY, v: 'weekly', loading: 'async', callback: CALLBACK })
    script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`
    script.async = true
    script.onerror = onError
    document.head.appendChild(script)
  })

  // Let a later attempt retry after a network failure, but not after the key was rejected.
  loading.catch(() => {
    if (!authFailed) loading = null
  })
  return loading
}

/** The map pieces we use. Times out too, so a stalled connection still falls back to the embed. */
export function importMapLibraries(): Promise<[google.maps.MapsLibrary, google.maps.CoreLibrary]> {
  const libraries = Promise.all([
    google.maps.importLibrary('maps') as Promise<google.maps.MapsLibrary>,
    google.maps.importLibrary('core') as Promise<google.maps.CoreLibrary>,
  ])
  const timeout = new Promise<never>((_, reject) =>
    window.setTimeout(() => reject(new Error('Google Maps took too long to load')), TIMEOUT_MS),
  )
  return Promise.race([libraries, timeout])
}
