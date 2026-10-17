interface ImportMetaEnv {
  /** Optional. Without it the map falls back to keyless Google embeds. */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
