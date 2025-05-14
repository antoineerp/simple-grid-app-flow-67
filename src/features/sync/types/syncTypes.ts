
// Defines common types for the sync functionality

export interface SyncHookOptions {
  showToasts?: boolean;
  autoSync?: boolean; 
  debounceTime?: number;
  syncKey?: string;
  maxRetries?: number;
  hideIndicators?: boolean; // Option pour masquer les indicateurs visuels
  batchSync?: boolean;     // Option pour regrouper plusieurs synchronisations
  priority?: number;       // Priorité de synchronisation (1: haute, 10: basse)
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
  recentAttempts: Array<{
    id: string;
    tableName: string; 
    startTime: number;
    endTime?: number;
    success: boolean;
    error?: string;
    duration?: number;
    operation: string; // Changed from optional to required to match SyncAttempt
  }>;
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

/**
 * Interface pour un résultat de synchronisation détaillé
 */
export interface DetailedSyncResult extends SyncOperationResult {
  tableName: string;
  timestamp: number;
  recordCount?: number;
  retryCount?: number;
}

/**
 * Statut de santé de la synchronisation
 */
export interface SyncHealthStatus {
  status: 'good' | 'warning' | 'critical';
  message: string;
  details: {
    successRate: number;
    failedCount: number;
    pendingCount: number;
    lastSuccessfulSync: Date | null;
  }
}

// Définir le type SyncAttempt pour garantir la présence de la propriété operation
export interface SyncAttempt {
  id: string;
  tableName: string;
  startTime: number;
  endTime?: number;
  success: boolean;
  error?: string;
  duration?: number;
  operation: string; // Propriété obligatoire (non optionnelle)
}
