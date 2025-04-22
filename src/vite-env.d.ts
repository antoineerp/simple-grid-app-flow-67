
/// <reference types="vite/client" />

// Déclaration du mode d'application pour TypeScript
declare const __APP_MODE__: string;

// Déclaration de __WS_TOKEN__ pour éviter l'erreur
declare const __WS_TOKEN__: string;

// Déclaration de types globaux
interface Window {
  __LOVABLE_EDITOR__: any;
  __WS_TOKEN__?: string;
}
