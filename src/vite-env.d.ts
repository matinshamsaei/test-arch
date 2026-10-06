/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_URL?: string;
  readonly VITE_ACCESS_TOKEN?: string;
  readonly VITE_PROVIDER_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
