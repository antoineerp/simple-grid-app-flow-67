
/**
 * Core synchronization operations
 */

import { acquireLock, releaseLock } from './syncLockManager';
import { saveLocalData } from './syncStorageManager';
import { SyncOperationResult } from '../types/syncTypes';
import { syncQueue } from './syncQueue';
import { syncMonitor } from './syncMonitor';

// Tableau pour stocker les noms des tables synchronisées récemment (pour éviter les doublons)
const recentlySyncedTables = new Set<string>();
// Stockage du dernier timestamp de synchronisation par table
const lastSyncTimestamps: Record<string, number> = {};
// Délai minimum entre deux synchronisations en millisecondes (3 secondes)
const MIN_SYNC_INTERVAL = 3000;

// Nettoie la liste des tables synchronisées récemment après un délai
const cleanupRecentlySynced = (tableName: string) => {
  setTimeout(() => {
    recentlySyncedTables.delete(tableName);
    console.log(`SyncOperations: Table ${tableName} retirée de la liste des synchronisations récentes`);
  }, 5000); // 5 secondes de "cooldown" entre les synchronisations
};

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
  
  // Vérifier le délai minimum entre deux synchronisations de la même table
  const now = Date.now();
  const lastSync = lastSyncTimestamps[tableName] || 0;
  if (now - lastSync < MIN_SYNC_INTERVAL && trigger === "auto") {
    console.log(`SyncOperations: Synchronisation de ${tableName} trop fréquente, ignorée (dernière: ${new Date(lastSync).toISOString()})`);
    return { success: true, message: "Synchronization throttled" };
  }
  
  // Vérifier si cette table a été synchronisée récemment
  if (recentlySyncedTables.has(tableName) && trigger === "auto") {
    console.log(`SyncOperations: Table ${tableName} synchronisée récemment, ignorée (trigger: ${trigger})`);
    return { success: true, message: "Already synced recently" };
  }
  
  // Ajouter cette table à la liste des tables synchronisées récemment
  recentlySyncedTables.add(tableName);
  cleanupRecentlySynced(tableName);

  // Déterminer la priorité en fonction du type de déclenchement
  const priority = trigger === "manual" ? 1 : (trigger === "initial" ? 3 : 5);

  // Enqueue the task with priority
  try {
    return await syncQueue.enqueue(tableName, async () => {
      // Try to acquire a lock
      if (!acquireLock(tableName)) {
        console.log(`SyncOperations: Synchronization already in progress for ${tableName}, request ignored`);
        return { success: false, message: "Synchronization already in progress" };
      }

      // Generate a unique operation ID
      const operationId = `${tableName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      console.log(`SyncOperations: Starting synchronization ${tableName} (operation ${operationId}, trigger: ${trigger})`);
      
      // Record the start of the operation in the monitor
      syncMonitor.recordSyncStart({
        attemptId: operationId,
        tableName,
        operation: `${trigger}-sync`
      });
      
      // Mettre à jour le timestamp de dernière synchronisation
      lastSyncTimestamps[tableName] = Date.now();
      
      // Emit an event to inform the application about the sync start
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('syncStarted', { 
          detail: { tableName, operationId, trigger } 
        }));
      }
      
      try {
        // Always save locally first to prevent data loss
        saveLocalData(tableName, data, syncKey);
        
        // Perform the actual synchronization with timeout handling
        const syncPromise = syncFn(tableName, data, operationId);
        
        // Create a timeout promise (reduced to 10 seconds)
        const timeoutPromise = new Promise<boolean>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Synchronization timeout for ${tableName} (operation ${operationId})`));
          }, 10000); // 10 seconds timeout
        });
        
        // Race between sync and timeout
        const success = await Promise.race([syncPromise, timeoutPromise]);

        if (success) {
          console.log(`SyncOperations: Synchronization successful for ${tableName} (operation ${operationId})`);
          
          // Record the success in the monitor
          syncMonitor.recordSyncEnd(operationId, true);
          
          // Emit a success event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('syncCompleted', { 
              detail: { tableName, operationId, trigger } 
            }));
          }
          
          return { success: true, message: "Synchronization successful" };
        } else {
          console.error(`SyncOperations: Synchronization failed for ${tableName} (operation ${operationId})`);
          
          // Record the failure in the monitor
          syncMonitor.recordSyncEnd(operationId, false, "Synchronization failed");
          
          // Emit a failure event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('syncFailed', { 
              detail: { tableName, operationId, error: "Synchronization failed" } 
            }));
          }
          
          return { success: false, message: "Synchronization failed" };
        }
      } catch (error) {
        console.error(`SyncOperations: Error during synchronization of ${tableName}:`, error);
        
        // Record the error in the monitor
        syncMonitor.recordSyncEnd(operationId, false, error instanceof Error ? error.message : String(error));
        
        // Emit an error event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('syncFailed', { 
            detail: { 
              tableName, 
              operationId, 
              error: error instanceof Error ? error.message : String(error) 
            } 
          }));
        }
        
        return { 
          success: false, 
          message: error instanceof Error ? error.message : String(error) 
        };
      } finally {
        // Always release the lock when done
        releaseLock(tableName);
      }
    }, priority);
  } catch (queueError) {
    console.error(`SyncOperations: Queue error for ${tableName}:`, queueError);
    return {
      success: false,
      message: queueError instanceof Error ? queueError.message : String(queueError)
    };
  }
};

// Check if a synchronization is in progress for a table
export const isSynchronizing = (tableName: string): boolean => {
  return syncQueue.hasPendingTasks(tableName) || syncMonitor.hasActiveSync(tableName);
};

// Cancel pending synchronizations for a table
export const cancelPendingSynchronizations = (tableName: string): number => {
  recentlySyncedTables.delete(tableName);
  return syncQueue.cancelPendingTasks(tableName);
};

// Expose a method to clean sync history via the API
export const cleanupSyncHistory = async (): Promise<{ success: boolean, message: string }> => {
  try {
    const API_URL = process.env.REACT_APP_API_URL || 'https://qualiopi.ch/api';
    const response = await fetch(`${API_URL}/check.php?action=cleanup_duplicates`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.status === 'success') {
      console.log(`SyncOperations: Nettoyage des doublons effectué - ${result.duplicatesRemoved} entrées supprimées`);
      return { success: true, message: result.message };
    } else {
      console.error(`SyncOperations: Erreur lors du nettoyage: ${result.message}`);
      return { success: false, message: result.message };
    }
  } catch (error) {
    console.error('SyncOperations: Erreur lors du nettoyage de l\'historique:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : String(error)
    };
  }
};
