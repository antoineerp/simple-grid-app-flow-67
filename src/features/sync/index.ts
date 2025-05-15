
/**
 * Main export file for sync functionality
 */

// Export types (sans ambiguïté)
export { 
  SyncMonitorStatus,
  SyncOperationResult,
  SyncOptions, 
  SyncState 
} from './types/syncTypes';

// Export hooks
export * from './hooks/useSyncContext';

// Export utilities
export * from './utils/errorLogger';
export * from './utils/syncLockManager';
export * from './utils/syncStorageManager';
export * from './utils/syncOperations';

// Initialize error logging
import { initializeErrorLogging } from './utils/errorLogger';
initializeErrorLogging();
