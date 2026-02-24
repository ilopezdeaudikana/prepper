/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MASTRA_API_PROTOCOL?: string
  readonly VITE_MASTRA_API_HOST?: string
  readonly VITE_MASTRA_API_PORT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
