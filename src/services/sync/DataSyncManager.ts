
// Définir l'enum SyncStatus
export enum SyncStatus {
  Idle = "Idle",
  Syncing = "Syncing",
  Error = "Error"
}

class DataSyncManager {
  private status: SyncStatus = SyncStatus.Idle;

  getSyncStatus(): SyncStatus {
    return this.status;
  }

  setSyncStatus(status: SyncStatus): void {
    this.status = status;
  }

  // Autres méthodes nécessaires au fonctionnement du gestionnaire de synchronisation
}

// Exporter une instance singleton
export const dataSyncManager = new DataSyncManager();
