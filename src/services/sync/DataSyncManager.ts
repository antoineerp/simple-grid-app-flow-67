
// Si le fichier ne contient pas ces exports, ajoutons-les

export interface SyncStatus {
  isSyncing: boolean;
  lastSynced: number | null;
  hasError: boolean;
  errorMessage: string | null;
  hasPendingChanges: boolean;
}

export interface SyncRecord {
  status: 'idle' | 'syncing' | 'error' | 'success';
  lastSynced: Date | null;
  lastError: string | null;
  pendingChanges: boolean;
}

export interface SyncOptions {
  showToast?: boolean;
  force?: boolean;
}

export interface SyncResult {
  success: boolean;
  error?: string;
  timestamp?: number;
}

class DataSyncManager {
  private tableStatuses: Map<string, SyncStatus>;
  private localData: Map<string, any[]>;

  constructor() {
    console.log("DataSyncManager initialisé");
    this.tableStatuses = new Map();
    this.localData = new Map();
  }

  // Méthode pour obtenir le statut d'une table
  public getTableStatus(tableName: string): SyncStatus {
    if (!this.tableStatuses.has(tableName)) {
      this.tableStatuses.set(tableName, {
        isSyncing: false,
        lastSynced: null,
        hasError: false,
        errorMessage: null,
        hasPendingChanges: false
      });
    }
    return this.tableStatuses.get(tableName)!;
  }

  // Méthode pour sauvegarder les données localement
  public saveLocalData<T>(tableName: string, data: T[]): void {
    this.localData.set(tableName, data);
    const status = this.getTableStatus(tableName);
    status.hasPendingChanges = true;
    this.tableStatuses.set(tableName, status);
    
    // Sauvegarder dans localStorage pour persistance
    try {
      localStorage.setItem(`sync_data_${tableName}`, JSON.stringify(data));
    } catch (e) {
      console.error("Erreur lors de la sauvegarde des données locales:", e);
    }
  }

  // Méthode pour obtenir les données locales
  public getLocalData<T>(tableName: string): T[] {
    if (this.localData.has(tableName)) {
      return this.localData.get(tableName) as T[];
    }

    // Essayer de récupérer depuis localStorage
    try {
      const storedData = localStorage.getItem(`sync_data_${tableName}`);
      if (storedData) {
        const parsedData = JSON.parse(storedData) as T[];
        this.localData.set(tableName, parsedData);
        return parsedData;
      }
    } catch (e) {
      console.error("Erreur lors de la récupération des données locales:", e);
    }

    return [] as T[];
  }

  // Méthode pour synchroniser les données
  public async syncTable<T>(tableName: string, data: T[], options?: SyncOptions): Promise<SyncResult> {
    const status = this.getTableStatus(tableName);
    if (status.isSyncing && !(options?.force)) {
      return { success: false, error: "Synchronisation déjà en cours" };
    }

    // Mettre à jour le statut pour indiquer que la synchronisation est en cours
    status.isSyncing = true;
    this.tableStatuses.set(tableName, status);

    try {
      // Ici vous ajouteriez la logique de synchronisation avec le serveur
      console.log(`Synchronisation de la table ${tableName} avec ${data.length} éléments`);
      
      // Simulons une réussite
      const result: SyncResult = { 
        success: true,
        timestamp: Date.now()
      };

      // Mettre à jour le statut après synchronisation
      const updatedStatus = {
        ...status,
        isSyncing: false,
        lastSynced: result.timestamp,
        hasError: false,
        errorMessage: null,
        hasPendingChanges: false
      };
      this.tableStatuses.set(tableName, updatedStatus);

      return result;
    } catch (error) {
      // Mettre à jour le statut en cas d'erreur
      const updatedStatus = {
        ...status,
        isSyncing: false,
        hasError: true,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
      this.tableStatuses.set(tableName, updatedStatus);

      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // Méthode pour charger les données depuis le serveur
  public async loadData<T>(tableName: string, options?: SyncOptions): Promise<T[]> {
    // Ici vous ajouteriez la logique pour charger les données depuis le serveur
    // Mais pour l'instant, retournons simplement les données locales
    return this.getLocalData<T>(tableName);
  }
}

// Singleton
export const dataSyncManager = new DataSyncManager();
