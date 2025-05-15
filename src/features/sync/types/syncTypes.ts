
/**
 * Options pour la synchronisation
 */
export interface SyncOptions {
  autoSync?: boolean;
  syncInterval?: number;
  retryOnFailure?: boolean;
  maxRetries?: number;
}

/**
 * État de synchronisation d'une table
 */
export interface SyncState {
  isSyncing: boolean;
  lastSynced: string | null;
  pendingOperations: number;
  error: string | null;
  syncFailed?: boolean;
  pendingSync?: boolean;
  dataChanged?: boolean;
}

/**
 * Résultat d'une opération de synchronisation
 */
export interface SyncOperationResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Statut du moniteur de synchronisation
 */
export enum SyncMonitorStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  ERROR = 'error'
}

/**
 * Type d'opération de synchronisation
 */
export enum SyncOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  SYNC = 'sync'
}

/**
 * Configuration d'une table pour la synchronisation
 */
export interface SyncTableConfig {
  tableName: string;
  endpoint: string;
  primaryKey: string;
  trackChanges?: boolean;
  autoSync?: boolean;
}
