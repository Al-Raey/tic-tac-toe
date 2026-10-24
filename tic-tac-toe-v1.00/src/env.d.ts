interface ImportMetaEnv {
  readonly PROD: boolean;
  readonly VITE_ADSENSE_ENABLED?: string;
  readonly VITE_ADSENSE_CONSENT_READY?: string;
  readonly VITE_ADSENSE_CLIENT?: string;
  readonly VITE_ADSENSE_SLOT_GAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
