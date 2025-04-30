
/**
 * Core synchronization operations
 */

import { acquireLock, releaseLock } from './syncLockManager';
import { saveLocalData } from './syncStorageManager';
import { SyncOperationResult } from '../types/syncTypes';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';

// Execute a sync operation with proper locking
export const executeSyncOperation = async <T>(
  tableName: string, 
  data: T[], 
  syncFn: (tableName: string, data: T[], operationId: string) => Promise<boolean>,
  syncKey?: string,
  trigger: "auto" | "manual" | "initial" = "auto"
): Promise<SyncOperationResult> => {
  // Check if the data is valid
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.log(`SyncOperations: No data to sync for ${tableName}`);
    return { success: false, message: "No data to synchronize" };
  }

  // Try to acquire a lock
  if (!acquireLock(tableName)) {
    console.log(`SyncOperations: Synchronization already in progress for ${tableName}, request ignored`);
    return { success: false, message: "Synchronization already in progress" };
  }

  // Generate a unique operation ID
  const operationId = `${tableName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  console.log(`SyncOperations: Starting synchronization ${tableName} (operation ${operationId})`);
  
  try {
    // Always save locally first to prevent data loss
    saveLocalData(tableName, data, syncKey);
    
    // Perform the actual synchronization
    const success = await syncFn(tableName, data, operationId);

    if (success) {
      console.log(`SyncOperations: Synchronization successful for ${tableName} (operation ${operationId})`);
      return { success: true, message: "Synchronization successful" };
    } else {
      console.error(`SyncOperations: Synchronization failed for ${tableName} (operation ${operationId})`);
      return { success: false, message: "Synchronization failed" };
    }
  } catch (error) {
    console.error(`SyncOperations: Error during synchronization of ${tableName}:`, error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : String(error) 
    };
  } finally {
    // Always release the lock when done
    releaseLock(tableName);
  }
};
