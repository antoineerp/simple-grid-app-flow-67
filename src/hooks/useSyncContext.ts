
/**
 * Re-export useSyncContext from new location for backward compatibility
 */

export * from '@/features/sync/hooks/useSyncContext';
export * from '@/features/sync/types/syncTypes';

// Initialize error logging
import { initializeErrorLogging } from '@/features/sync/utils/errorLogger';
initializeErrorLogging();
