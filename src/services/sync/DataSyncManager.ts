
// Énumération pour les statuts de synchronisation
export enum SyncStatus {
  Idle = 'idle',
  Syncing = 'syncing',
  Error = 'error',
}

// Options pour la synchronisation
export interface SyncOptions {
  showToast?: boolean;
}

// Structure pour les enregistrements de synchronisation
export interface SyncRecord<T> {
  timestamp: Date;
  data: T;
  status: 'pending' | 'synced' | 'error';
  error?: string;
}

// Interface pour les types de tables de données
export interface DataTable<T> {
  name: string;
  endpoint: string;
  getData: () => T[];
  setData: (data: T[]) => void;
}

// Résultat de synchronisation
export interface SyncResult {
  success: boolean;
  message?: string;
  error?: any;
}

// Gestionnaire de synchronisation de données
class DataSyncManager {
  private status: SyncStatus = SyncStatus.Idle;
  private lastError: Error | null = null;
  private lastSynced: Date | null = null;

  constructor() {
    console.log('DataSyncManager initialized');
  }

  // Obtenir le statut actuel de synchronisation
  getSyncStatus(): SyncStatus {
    return this.status;
  }

  // Définir le statut de synchronisation
  private setStatus(status: SyncStatus): void {
    this.status = status;
  }

  // Synchroniser une table spécifique
  async syncTable<T>(table: DataTable<T>, options?: SyncOptions): Promise<SyncResult> {
    try {
      this.setStatus(SyncStatus.Syncing);
      
      // Logique de synchronisation avec le serveur
      console.log(`Synchronizing table: ${table.name}`);
      
      // Simuler un délai de réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.setStatus(SyncStatus.Idle);
      this.lastSynced = new Date();
      
      return { success: true };
    } catch (error) {
      this.setStatus(SyncStatus.Error);
      this.lastError = error as Error;
      console.error(`Error syncing table ${table.name}:`, error);
      return { 
        success: false, 
        error: error,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // Synchroniser toutes les tables
  async syncAllTables(): Promise<SyncResult[]> {
    // Cette méthode serait implémentée pour synchroniser toutes les tables
    console.log("Syncing all tables");
    return [{ success: true }];
  }

  // Réinitialiser le statut d'erreur
  resetErrorStatus(): void {
    if (this.status === SyncStatus.Error) {
      this.status = SyncStatus.Idle;
      this.lastError = null;
    }
  }

  // Obtenir la dernière erreur
  getLastError(): Error | null {
    return this.lastError;
  }

  // Obtenir la date de dernière synchronisation
  getLastSynced(): Date | null {
    return this.lastSynced;
  }
}

// Exporter une instance singleton
export const dataSyncManager = new DataSyncManager();
