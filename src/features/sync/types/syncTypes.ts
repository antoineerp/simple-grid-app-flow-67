
// Defines common types for the sync functionality

export interface SyncHookOptions {
  showToasts?: boolean;
  autoSync?: boolean; 
  debounceTime?: number;
  syncKey?: string;
  maxRetries?: number;
  hideIndicators?: boolean; // Nouvelle option pour masquer les indicateurs visuels
}

export interface SyncState {
  isSyncing: boolean;
  lastSynced: Date | null;
  syncFailed: boolean;
  pendingSync: boolean;
  dataChanged: boolean;
}

export interface SyncOperationResult {
  success: boolean;
  message: string;
}

/**
 * Types pour le monitoring global de synchronisation
 */
export interface SyncMonitorStatus {
  activeCount: number;
  recentAttempts: any[];
  stats: {
    success: number;
    failure: number;
  };
  health: 'good' | 'warning' | 'critical';
  lastSync: {
    time: number | null;
    success: boolean;
  };
}
