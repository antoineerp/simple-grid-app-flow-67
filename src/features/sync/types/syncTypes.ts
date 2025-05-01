
// Types pour la synchronisation
export interface SyncAttempt {
  id: string;
  tableName: string;
  startTime: number;
  endTime?: number;
  success: boolean;
  error?: string;
  duration?: number;
  operation?: string; // Rendre cette propriété optionnelle pour éviter les erreurs
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
}

export interface SyncState {
  isSyncing: boolean;
  lastSynced: Date | null;
  syncFailed: boolean;
}

export interface SyncStateRecord {
  [tableName: string]: SyncState;
}
