// Types pour la synchronisation
export interface SyncAttempt {
  id: string;
  tableName: string;
  startTime: number;
  endTime?: number;
  success: boolean;
  error?: string;
  duration?: number;
  operation: string; // Changed from optional to required
}

export interface SyncStatus {
  activeCount: number;
  health: 'good' | 'warning' | 'critical';
  recentAttempts: SyncAttempt[];
  stats: {
    success: number;
    failure: number;
  };
  lastSync: {
    time: number | null;
    success: boolean;
  };
}

export interface SyncOptions {
  mode?: 'manual' | 'auto' | 'background';
  priority?: 'high' | 'normal' | 'low';
  showToast?: boolean;
  hideIndicators?: boolean;
}

// Added SyncHookOptions for useSyncContext
export interface SyncHookOptions {
  showToasts?: boolean;
  hideIndicators?: boolean;
}

export interface SyncState {
  isSyncing: boolean;
  lastSynced: Date | null;
  syncFailed: boolean;
  pendingSync?: boolean;
  dataChanged?: boolean;
}

export interface SyncStateRecord {
  [tableName: string]: SyncState;
}

// Added missing interfaces for sync operations
export interface SyncOperationResult {
  success: boolean;
  message?: string;
  data?: any;
}

// Added SyncMonitorStatus
export interface SyncMonitorStatus {
  activeCount: number;
  recentAttempts: SyncAttempt[];
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
