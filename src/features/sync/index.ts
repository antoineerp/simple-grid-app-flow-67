
/**
 * Main export file for sync functionality
 */

// Export types (avec export type pour éviter les erreurs isolatedModules)
export type { 
  SyncMonitorStatus,
  SyncOperationResult,
  SyncOptions, 
  SyncState 
} from './types/syncTypes';

// Export hooks
export { useSyncContext, SyncProvider } from './hooks/useSyncContext';

// Export utilities
export { saveSyncData, loadSyncData, removeSyncData, getAllSyncKeys, clearAllSyncData } from './utils/syncStorageManager';
export { syncTable, fetchSyncedData } from './utils/syncOperations';
export { logSyncError, initializeErrorLogging } from './utils/errorLogger';
export { acquireLock, releaseLock, isLocked } from './utils/syncLockManager';
