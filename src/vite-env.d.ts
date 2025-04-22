
/// <reference types="vite/client" />

declare const __APP_MODE__: string;
declare const __WS_TOKEN__: string;

interface Window {
  __LOVABLE_EDITOR__: any;
  __WS_TOKEN__?: string;
}
