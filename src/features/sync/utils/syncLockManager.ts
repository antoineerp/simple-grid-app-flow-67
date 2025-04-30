
/**
 * Utility for managing synchronization locks
 */

// Helper to check if a sync operation is in progress for a table
export const checkSyncInProgress = (tableName: string): boolean => {
  try {
    const isSyncingNow = localStorage.getItem(`sync_in_progress_${tableName}`) === 'true';
    
    if (isSyncingNow) {
      // Check if the lock has expired (more than 30 seconds)
      const lockTimestamp = localStorage.getItem(`sync_lock_time_${tableName}`);
      
      if (lockTimestamp) {
        const lockTime = parseInt(lockTimestamp, 10);
        const now = Date.now();
        
        if (now - lockTime > 30000) { // 30 seconds
          console.log(`SyncLockManager: Lock expired for ${tableName}, forcing release`);
          localStorage.removeItem(`sync_in_progress_${tableName}`);
          localStorage.removeItem(`sync_lock_time_${tableName}`);
          return false;
        }
      }
    }
    
    return isSyncingNow;
  } catch (error) {
    console.error(`SyncLockManager: Error checking lock for ${tableName}:`, error);
    return false;
  }
};

// Acquire a lock for synchronization
export const acquireLock = (tableName: string): boolean => {
  if (checkSyncInProgress(tableName)) {
    return false;
  }
  
  try {
    localStorage.setItem(`sync_in_progress_${tableName}`, 'true');
    localStorage.setItem(`sync_lock_time_${tableName}`, Date.now().toString());
    return true;
  } catch (error) {
    console.error(`SyncLockManager: Error acquiring lock for ${tableName}:`, error);
    return false;
  }
};

// Release a synchronization lock
export const releaseLock = (tableName: string): void => {
  try {
    localStorage.removeItem(`sync_in_progress_${tableName}`);
    localStorage.removeItem(`sync_lock_time_${tableName}`);
  } catch (error) {
    console.error(`SyncLockManager: Error releasing lock for ${tableName}:`, error);
  }
};
