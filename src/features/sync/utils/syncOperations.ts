/**
 * Core synchronization operations
 */

import { acquireLock, releaseLock } from './syncLockManager';
import { saveLocalData } from './syncStorageManager';
import { SyncOperationResult } from '../types/syncTypes';
import { syncQueue } from './syncQueue';
import { syncMonitor } from './syncMonitor';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

// Base de données fixe
const FIXED_DB_USER = 'p71x6d_richard';

// Tableau pour stocker les noms des tables synchronisées récemment (pour éviter les doublons)
const recentlySyncedTables = new Set<string>();

// Nettoie la liste des tables synchronisées récemment après un délai
const cleanupRecentlySynced = (tableName: string) => {
  setTimeout(() => {
    recentlySyncedTables.delete(tableName);
    console.log(`SyncOperations: Table ${tableName} retirée de la liste des synchronisations récentes`);
  }, 5000); // 5 secondes de "cooldown" entre les synchronisations
};

/**
 * Vérifie si une table est en cours de synchronisation
 */
export const isSynchronizing = (tableName: string): boolean => {
  // Vérifier si la table a un verrou actif
  return localStorage.getItem(`sync_in_progress_${tableName}`) === 'true';
};

// Execute a sync operation with proper locking
export const executeSyncOperation = async <T>(
  tableName: string, 
  data: T[], 
  syncFn: (tableName: string, data: T[], operationId: string) => Promise<boolean>,
  syncKey?: string,
  trigger: "auto" | "manual" | "initial" = "auto"
): Promise<SyncOperationResult> => {
  // Forcer l'utilisation de l'utilisateur de base de données fixe
  const userId = FIXED_DB_USER;
  
  console.log(`SyncOperations: Synchronisation de ${tableName} avec la base ${FIXED_DB_USER}`);
  
  // Check if the data is valid
  if (!data || !Array.isArray(data)) {
    console.log(`SyncOperations: Data invalid for ${tableName}, initializing empty array`);
    data = [] as unknown as T[];
  }
  
  // Log data shape for debugging
  console.log(`SyncOperations: Sync for ${tableName} has ${data?.length || 0} items, data type: ${Array.isArray(data) ? 'array' : typeof data}`);
  
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
      try {
        // Release any existing lock first to prevent deadlocks
        releaseLock(tableName);
        
        // Try to acquire a lock
        if (!acquireLock(tableName)) {
          console.log(`SyncOperations: Synchronization already in progress for ${tableName}, request ignored`);
          return { success: false, message: "Synchronization already in progress" };
        }

        // Generate a unique operation ID
        const operationId = `${tableName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        console.log(`SyncOperations: Starting synchronization ${tableName} avec base ${FIXED_DB_USER} (operation ${operationId}, trigger: ${trigger})`);
        
        // Enregistrer le début de l'opération dans le moniteur
        syncMonitor.recordSyncStart(operationId, `${trigger}-sync`);
        
        // Émettre un événement pour informer l'application du début de la synchronisation
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('syncStarted', { 
            detail: { tableName, operationId, trigger } 
          }));
        }
        
        try {
          // Always save locally first to prevent data loss
          saveLocalData(tableName, data, userId);
          
          // Perform the actual synchronization with timeout handling
          const syncPromise = syncFn(tableName, data, operationId);
          
          // Create a timeout promise
          const timeoutPromise = new Promise<boolean>((_, reject) => {
            setTimeout(() => {
              reject(new Error(`Synchronization timeout for ${tableName} (operation ${operationId})`));
            }, 15000); // 15 secondes timeout
          });
          
          // Race between sync and timeout
          const success = await Promise.race([syncPromise, timeoutPromise]);

          if (success) {
            console.log(`SyncOperations: Synchronization successful for ${tableName} (operation ${operationId})`);
            
            // Enregistrer le succès dans le moniteur
            syncMonitor.recordSyncEnd(operationId, true);
            
            // Émettre un événement de succès
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('syncCompleted', { 
                detail: { tableName, operationId, trigger } 
              }));
            }
            
            return { success: true, message: "Synchronization successful" };
          } else {
            console.error(`SyncOperations: Synchronization failed for ${tableName} (operation ${operationId})`);
            
            // Enregistrer l'échec dans le moniteur
            syncMonitor.recordSyncEnd(operationId, false, "Synchronization failed");
            
            // Émettre un événement d'échec
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('syncFailed', { 
                detail: { tableName, operationId, error: "Synchronization failed" } 
              }));
            }
            
            return { success: false, message: "Synchronization failed" };
          }
        } catch (error) {
          console.error(`SyncOperations: Error during synchronization of ${tableName}:`, error);
          
          // Enregistrer l'erreur dans le moniteur
          syncMonitor.recordSyncEnd(operationId, false, error instanceof Error ? error.message : String(error));
          
          // Émettre un événement d'erreur
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
          // Always release the lock
          releaseLock(tableName);
        }
      } catch (error) {
        console.error(`SyncOperations: Unexpected error in sync queue for ${tableName}:`, error);
        releaseLock(tableName);
        return { 
          success: false, 
          message: error instanceof Error ? error.message : String(error)
        };
      }
    });
  } catch (error) {
    console.error(`SyncOperations: Error enqueuing sync task for ${tableName}:`, error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : String(error)
    };
  }
};
