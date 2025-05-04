
// Types pour la compatibilité
export type SyncStatus = 'success';

export interface SyncState {
  isSyncing: false;
  lastSynced: number;
  hasError: false;
  errorMessage: null;
  hasPendingChanges: false;
}

export interface SyncRecord {
  status: SyncStatus;
  lastSynced: Date;
  lastError: null;
  pendingChanges: false;
}

export interface SyncOptions {
  showToast?: boolean;
  force?: boolean;
}

export interface SyncResult {
  success: true;
  timestamp: number;
}

// Version simplifiée qui simule toujours un succès
class DataSyncManager {
  // Méthode pour obtenir le statut d'une table
  public getTableStatus(tableName: string): SyncState {
    return {
      isSyncing: false,
      lastSynced: Date.now(),
      hasError: false,
      errorMessage: null,
      hasPendingChanges: false
    };
  }

  // Méthode pour sauvegarder les données localement
  public saveLocalData<T>(tableName: string, data: T[]): void {
    try {
      localStorage.setItem(`sync_data_${tableName}`, JSON.stringify(data));
    } catch (e) {
      console.error("Erreur lors de la sauvegarde des données locales:", e);
    }
  }

  // Méthode pour obtenir les données locales
  public getLocalData<T>(tableName: string): T[] {
    try {
      const storedData = localStorage.getItem(`sync_data_${tableName}`);
      if (storedData) {
        return JSON.parse(storedData) as T[];
      }
    } catch (e) {
      console.error("Erreur lors de la récupération des données locales:", e);
    }
    return [] as T[];
  }

  // Méthode pour synchroniser les données (simulée)
  public async syncTable<T>(tableName: string, data: T[]): Promise<SyncResult> {
    try {
      localStorage.setItem(`sync_data_${tableName}`, JSON.stringify(data));
      return { 
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`Erreur lors de l'enregistrement local pour ${tableName}:`, error);
      return { 
        success: true,
        timestamp: Date.now()
      };
    }
  }

  // Méthode pour charger les données (uniquement depuis le stockage local)
  public async loadData<T>(tableName: string): Promise<T[]> {
    try {
      const storedData = localStorage.getItem(`sync_data_${tableName}`);
      if (storedData) {
        return JSON.parse(storedData) as T[];
      }
    } catch (error) {
      console.error(`Erreur lors du chargement des données pour ${tableName}:`, error);
    }
    return [] as T[];
  }

  // Méthodes factices pour la compatibilité
  public markSyncSuccess(tableName: string): void {}
  public markSyncFailed(tableName: string, errorMessage: string): void {}

  // Méthode pour obtenir l'état global de synchronisation
  public getGlobalSyncStatus(): {
    activeSyncCount: number;
    pendingChangesCount: number;
    failedSyncCount: number;
  } {
    return {
      activeSyncCount: 0,
      pendingChangesCount: 0,
      failedSyncCount: 0
    };
  }

  // Méthode pour convertir SyncState à SyncRecord
  public getSyncStatus(tableName: string): SyncRecord {
    return {
      status: 'success',
      lastSynced: new Date(),
      lastError: null,
      pendingChanges: false
    };
  }
  
  // Méthode pour synchroniser toutes les tables
  public async syncAllPendingChanges(): Promise<Record<string, SyncResult>> {
    return {};
  }
}

// Singleton
export const dataSyncManager = new DataSyncManager();
