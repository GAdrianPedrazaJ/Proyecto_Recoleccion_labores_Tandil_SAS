/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_FUNCTION_URL: string
  readonly VITE_SYNC_INTERVAL_MS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
