
// Définir l'enum SyncStatus
export enum SyncStatus {
  Idle = "Idle",
  Syncing = "Syncing",
  Error = "Error"
}

// Define SyncOptions interface
export interface SyncOptions {
  force?: boolean;
  silent?: boolean;
  background?: boolean;
}

// Define SyncRecord interface
export interface SyncRecord<T = any> {
  key: string;
  data: T;
  lastSynced?: Date;
  pendingChanges: boolean;
}

class DataSyncManager {
  private status: SyncStatus = SyncStatus.Idle;
  private localData: Map<string, any> = new Map();
  
  getSyncStatus(): SyncStatus {
    return this.status;
  }

  setSyncStatus(status: SyncStatus): void {
    this.status = status;
  }
  
  // Method to get local data
  async getLocalData<T>(key: string): Promise<T | null> {
    try {
      if (this.localData.has(key)) {
        return this.localData.get(key) as T;
      }
      
      const storedData = localStorage.getItem(`sync_data_${key}`);
      if (storedData) {
        const data = JSON.parse(storedData) as T;
        this.localData.set(key, data);
        return data;
      }
      return null;
    } catch (error) {
      console.error(`Error retrieving local data for key ${key}:`, error);
      return null;
    }
  }
  
  // Method to save data locally
  async saveLocalData<T>(key: string, data: T): Promise<boolean> {
    try {
      this.localData.set(key, data);
      localStorage.setItem(`sync_data_${key}`, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error saving local data for key ${key}:`, error);
      return false;
    }
  }
  
  // Method to sync data with server
  async syncData<T>(endpoint: string, data: T, options?: SyncOptions): Promise<boolean> {
    try {
      if (!navigator.onLine) {
        return false;
      }
      
      this.setSyncStatus(SyncStatus.Syncing);
      
      // Simulate API call success
      // In a real application, you would make an actual API call here
      console.log(`Syncing data with endpoint ${endpoint}`, data);
      
      // Wait for a moment to simulate network request
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.setSyncStatus(SyncStatus.Idle);
      return true;
    } catch (error) {
      console.error(`Error syncing data with endpoint ${endpoint}:`, error);
      this.setSyncStatus(SyncStatus.Error);
      return false;
    }
  }
  
  // Method to sync all tables
  async syncAllTables(): Promise<boolean> {
    try {
      this.setSyncStatus(SyncStatus.Syncing);
      
      // Get all keys from local storage that start with "sync_data_"
      const keys = Object.keys(localStorage)
        .filter(key => key.startsWith('sync_data_'))
        .map(key => key.replace('sync_data_', ''));
      
      // Sync each table
      for (const key of keys) {
        const data = await this.getLocalData(key);
        if (data) {
          // In a real app, you would determine the endpoint based on the key
          const endpoint = `/api/${key}-sync`;
          await this.syncData(endpoint, data);
        }
      }
      
      this.setSyncStatus(SyncStatus.Idle);
      return true;
    } catch (error) {
      console.error('Error syncing all tables:', error);
      this.setSyncStatus(SyncStatus.Error);
      return false;
    }
  }
}

// Exporter une instance singleton
export const dataSyncManager = new DataSyncManager();
