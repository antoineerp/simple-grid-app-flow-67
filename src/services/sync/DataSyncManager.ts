
import { syncService, SyncResult } from './SyncService';

interface SyncStatus {
  tableName: string;
  lastSynced: Date | null;
  status: 'success' | 'failed' | 'pending';
  pendingChanges: number;
}

class DataSyncManager {
  private syncStatus: Map<string, SyncStatus> = new Map();
  private activeSyncs: number = 0;

  /**
   * Récupère le statut de synchronisation global
   */
  getGlobalSyncStatus() {
    const pendingChangesCount = Array.from(this.syncStatus.values())
      .reduce((sum, status) => sum + status.pendingChanges, 0);
    
    return {
      pendingChangesCount,
      activeSyncCount: this.activeSyncs
    };
  }

  /**
   * Récupère le statut de synchronisation pour une table spécifique
   */
  getSyncStatus(tableName: string): SyncStatus {
    return this.syncStatus.get(tableName) || {
      tableName,
      lastSynced: null,
      status: 'pending',
      pendingChanges: 0
    };
  }

  /**
   * Marque une table comme ayant des modifications en attente
   */
  markTableAsChanged(tableName: string, changeCount: number = 1) {
    const currentStatus = this.getSyncStatus(tableName);
    
    this.syncStatus.set(tableName, {
      ...currentStatus,
      pendingChanges: currentStatus.pendingChanges + changeCount
    });
  }

  /**
   * Synchronise toutes les tables qui ont des modifications en attente
   */
  async syncAllPending(): Promise<SyncResult> {
    const tablesToSync = Array.from(this.syncStatus.entries())
      .filter(([_, status]) => status.pendingChanges > 0)
      .map(([tableName]) => tableName);
    
    if (tablesToSync.length === 0) {
      return { success: true, message: "Aucune modification en attente" };
    }
    
    try {
      this.activeSyncs++;
      
      // Sync each table one by one
      const results = await Promise.all(
        tablesToSync.map(async (tableName) => {
          try {
            // Load data from local storage
            const localData = localStorage.getItem(`${tableName}_data`);
            const localGroups = localStorage.getItem(`${tableName}_groups`);
            
            if (!localData) {
              return { tableName, success: true, message: "Pas de données locales" };
            }
            
            const data = JSON.parse(localData);
            const groups = localGroups ? JSON.parse(localGroups) : [];
            
            // Sync data with server
            const result = await syncService.syncTable({
              tableName,
              data,
              groups
            });
            
            // Update sync status
            if (result.success) {
              const currentStatus = this.getSyncStatus(tableName);
              this.syncStatus.set(tableName, {
                ...currentStatus,
                lastSynced: new Date(),
                status: 'success',
                pendingChanges: 0
              });
            }
            
            return { tableName, ...result };
          } catch (error) {
            console.error(`Error syncing ${tableName}:`, error);
            return {
              tableName,
              success: false,
              message: error instanceof Error ? error.message : "Unknown error"
            };
          }
        })
      );
      
      // Check if all syncs succeeded
      const allSuccess = results.every(r => r.success);
      const messages = results.map(r => `${r.tableName}: ${r.message || (r.success ? "OK" : "Failed")}`);
      
      return {
        success: allSuccess,
        message: allSuccess ? "All pending changes synced" : "Some syncs failed",
        details: {
          results,
          messages
        }
      };
    } catch (error) {
      console.error("Error syncing all pending changes:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error"
      };
    } finally {
      this.activeSyncs--;
    }
  }
}

export const dataSyncManager = new DataSyncManager();
