
/// <reference types="vite/client" />

// Extension du type Window pour inclure errorLogs
interface Window {
  errorLogs?: string[]; // Made optional to match the declaration in errorLogger.ts
}
