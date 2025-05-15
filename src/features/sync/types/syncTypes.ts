
/**
 * Types pour le système de synchronisation
 */

export enum SyncMonitorStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  ERROR = 'error',
  OFFLINE = 'offline'
}

export interface SyncOperationResult {
  success: boolean;
  timestamp?: Date;
  message?: string;
  data?: any;
}

export interface SyncOptions {
  forceSync?: boolean;
  silentMode?: boolean;
  priority?: 'high' | 'normal' | 'low';
  timeout?: number;
}

export interface SyncState {
  isSyncing: boolean;
  lastSynced: Date | null;
  error: string | null;
}

export interface SyncContextType {
  registerSyncFunction: (key: string, syncFn: () => Promise<boolean>) => void;
  unregisterSyncFunction: (key: string) => void;
  syncAll: () => Promise<boolean>;
  getSyncState: () => SyncState;
  isInitialized: () => boolean;
  isSyncEnabled: () => boolean;
  forceProcessQueue: () => Promise<void>;
  isOnline: boolean;
}
