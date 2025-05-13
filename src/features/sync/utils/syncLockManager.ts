
/**
 * Utility for managing synchronization locks
 */

// Helper to check if a sync operation is in progress for a table
export const checkSyncInProgress = (tableName: string): boolean => {
  try {
    const isSyncingNow = localStorage.getItem(`sync_in_progress_${tableName}`) === 'true';
    
    if (isSyncingNow) {
      // Check if the lock has expired (more than 60 seconds)
      const lockTimestamp = localStorage.getItem(`sync_lock_time_${tableName}`);
      
      if (lockTimestamp) {
        const lockTime = parseInt(lockTimestamp, 10);
        const now = Date.now();
        
        // Si le verrou a plus de 60 secondes, on le considère comme périmé
        if (now - lockTime > 60000) { // 60 seconds
          console.log(`SyncLockManager: Lock expired for ${tableName}, forcing release`);
          localStorage.removeItem(`sync_in_progress_${tableName}`);
          localStorage.removeItem(`sync_lock_time_${tableName}`);
          return false;
        }
      } else {
        // Pas de timestamp trouvé, mais le verrou est actif
        // On considère ce verrou comme suspect et on le libère
        console.log(`SyncLockManager: Lock with no timestamp found for ${tableName}, releasing`);
        localStorage.removeItem(`sync_in_progress_${tableName}`);
        return false;
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
  try {
    // Si un verrou est déjà présent, vérifier s'il est valide
    if (checkSyncInProgress(tableName)) {
      console.log(`SyncLockManager: Unable to acquire lock for ${tableName}, already locked`);
      return false;
    }
    
    // Définir un nouveau verrou
    localStorage.setItem(`sync_in_progress_${tableName}`, 'true');
    localStorage.setItem(`sync_lock_time_${tableName}`, Date.now().toString());
    
    // Double-vérification que le verrou est bien défini
    if (localStorage.getItem(`sync_in_progress_${tableName}`) !== 'true') {
      console.error(`SyncLockManager: Lock for ${tableName} could not be set`);
      return false;
    }
    
    console.log(`SyncLockManager: Lock acquired for ${tableName}`);
    return true;
  } catch (error) {
    console.error(`SyncLockManager: Error acquiring lock for ${tableName}:`, error);
    return false;
  }
};

// Release a synchronization lock
export const releaseLock = (tableName: string): void => {
  try {
    if (localStorage.getItem(`sync_in_progress_${tableName}`) === 'true') {
      console.log(`SyncLockManager: Releasing lock for ${tableName}`);
    }
    
    localStorage.removeItem(`sync_in_progress_${tableName}`);
    localStorage.removeItem(`sync_lock_time_${tableName}`);
  } catch (error) {
    console.error(`SyncLockManager: Error releasing lock for ${tableName}:`, error);
  }
};

// Function to check and clear all stalled locks
export const clearStalledLocks = (): void => {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sync_in_progress_')) {
        keys.push(key);
      }
    }
    
    const now = Date.now();
    let clearedCount = 0;
    
    for (const key of keys) {
      // Extract table name from key
      const tableName = key.replace('sync_in_progress_', '');
      const lockTimeKey = `sync_lock_time_${tableName}`;
      const lockTime = localStorage.getItem(lockTimeKey);
      
      if (lockTime) {
        const lockTimeValue = parseInt(lockTime, 10);
        if (now - lockTimeValue > 60000) { // 60 seconds timeout
          localStorage.removeItem(key);
          localStorage.removeItem(lockTimeKey);
          clearedCount++;
        }
      } else {
        // Lock with no timestamp, clear it
        localStorage.removeItem(key);
        clearedCount++;
      }
    }
    
    if (clearedCount > 0) {
      console.log(`SyncLockManager: Cleared ${clearedCount} stalled locks`);
    }
  } catch (error) {
    console.error('SyncLockManager: Error clearing stalled locks:', error);
  }
};

// Call clearStalledLocks on module import to ensure clean state
clearStalledLocks();
