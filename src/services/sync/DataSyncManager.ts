
// Si le fichier ne contient pas ces exports, ajoutons-les

// Type pour les états de synchronisation
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

export interface SyncState {
  isSyncing: boolean;
  lastSynced: number | null;
  hasError: boolean;
  errorMessage: string | null;
  hasPendingChanges: boolean;
}

export interface SyncRecord {
  status: SyncStatus;
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
  private tableStatuses: Map<string, SyncState>;
  private localData: Map<string, any[]>;

  constructor() {
    console.log("DataSyncManager initialisé");
    this.tableStatuses = new Map();
    this.localData = new Map();
  }

  // Méthode pour obtenir le statut d'une table
  public getTableStatus(tableName: string): SyncState {
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
      
      // Simulons une réussite après appel à l'API réelle
      const result: SyncResult = await this.syncWithApi(tableName, data);

      // Mettre à jour le statut après synchronisation
      const updatedStatus = {
        ...status,
        isSyncing: false,
        lastSynced: result.timestamp || Date.now(),
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

  // Méthode qui effectue réellement la synchronisation avec l'API
  private async syncWithApi<T>(tableName: string, data: T[]): Promise<SyncResult> {
    try {
      // Construction de l'URL de l'API
      const apiUrl = `/api/${tableName}-sync.php`;
      
      // Préparation des données pour l'API
      const payload = {
        userId: localStorage.getItem('currentUser') || 'p71x6d_system',
        [tableName]: data
      };
      
      console.log(`Envoi des données à ${apiUrl}:`, payload);
      
      // Appel à l'API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log(`Réponse de ${apiUrl}:`, responseData);
      
      if (!responseData.success) {
        throw new Error(responseData.message || "Synchronisation échouée");
      }
      
      return {
        success: true,
        timestamp: Date.now(),
        error: undefined
      };
    } catch (error) {
      console.error(`Erreur lors de la synchronisation avec l'API pour ${tableName}:`, error);
      throw error;
    }
  }

  // Méthode pour charger les données depuis le serveur
  public async loadData<T>(tableName: string, options?: SyncOptions): Promise<T[]> {
    try {
      // Construction de l'URL de l'API
      const apiUrl = `/api/${tableName}-load.php`;
      
      console.log(`Chargement des données depuis ${apiUrl}`);
      
      // Appel à l'API
      const response = await fetch(`${apiUrl}?userId=${localStorage.getItem('currentUser') || 'p71x6d_system'}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log(`Données reçues de ${apiUrl}:`, responseData);
      
      let data: T[] = [];
      
      if (responseData.success && responseData[tableName]) {
        data = responseData[tableName] as T[];
      } else if (responseData.success && responseData.data) {
        data = responseData.data as T[];
      } else if (responseData.success && responseData.documents) {
        data = responseData.documents as T[];
      } else if (Array.isArray(responseData)) {
        data = responseData as T[];
      }
      
      // Mettre à jour les données locales
      this.localData.set(tableName, data);
      localStorage.setItem(`sync_data_${tableName}`, JSON.stringify(data));
      
      // Mettre à jour le statut
      const status = this.getTableStatus(tableName);
      status.lastSynced = Date.now();
      status.hasError = false;
      status.errorMessage = null;
      status.hasPendingChanges = false;
      this.tableStatuses.set(tableName, status);
      
      return data;
    } catch (error) {
      console.error(`Erreur lors du chargement des données pour ${tableName}:`, error);
      
      // En cas d'erreur, essayer de récupérer les données locales
      return this.getLocalData<T>(tableName);
    }
  }

  // Ajout des méthodes manquantes utilisées par SyncService
  public markSyncSuccess(tableName: string): void {
    const status = this.getTableStatus(tableName);
    this.tableStatuses.set(tableName, {
      ...status,
      lastSynced: Date.now(),
      hasError: false,
      errorMessage: null,
      hasPendingChanges: false,
      isSyncing: false
    });
  }

  public markSyncFailed(tableName: string, errorMessage: string): void {
    const status = this.getTableStatus(tableName);
    this.tableStatuses.set(tableName, {
      ...status,
      hasError: true,
      errorMessage: errorMessage,
      isSyncing: false
    });
  }

  // Méthode pour obtenir l'état global de synchronisation
  public getGlobalSyncStatus(): {
    activeSyncCount: number;
    pendingChangesCount: number;
    failedSyncCount: number;
  } {
    let activeSyncCount = 0;
    let pendingChangesCount = 0;
    let failedSyncCount = 0;

    for (const status of this.tableStatuses.values()) {
      if (status.isSyncing) activeSyncCount++;
      if (status.hasPendingChanges) pendingChangesCount++;
      if (status.hasError) failedSyncCount++;
    }

    return {
      activeSyncCount,
      pendingChangesCount,
      failedSyncCount
    };
  }

  // Méthode pour convertir SyncState à SyncRecord pour garder la compatibilité
  public getSyncStatus(tableName: string): SyncRecord {
    const state = this.getTableStatus(tableName);
    return {
      status: state.isSyncing ? 'syncing' : state.hasError ? 'error' : state.lastSynced ? 'success' : 'idle',
      lastSynced: state.lastSynced ? new Date(state.lastSynced) : null,
      lastError: state.errorMessage,
      pendingChanges: state.hasPendingChanges
    };
  }
  
  // Méthode pour synchroniser toutes les tables avec des changements en attente
  public async syncAllPendingChanges(): Promise<Record<string, SyncResult>> {
    const results: Record<string, SyncResult> = {};
    
    for (const [tableName, status] of this.tableStatuses.entries()) {
      if (status.hasPendingChanges && !status.isSyncing) {
        console.log(`Synchronisation automatique des modifications en attente pour ${tableName}`);
        const data = this.getLocalData(tableName);
        results[tableName] = await this.syncTable(tableName, data);
      }
    }
    
    return results;
  }
}

// Singleton
export const dataSyncManager = new DataSyncManager();
