
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

export interface DataTable<T> {
  tableName: string;
  data: T[];
  groups?: any[];
}

export interface SyncResult {
  success: boolean;
  message?: string;
  details?: Record<string, any>;
  timestamp?: string;
}

class SyncService {
  private syncStatus: Map<string, { lastSynced: Date | null, status: 'success' | 'failed' | 'pending' }> = new Map();

  async syncTable<T>(table: DataTable<T>, userId?: string): Promise<SyncResult> {
    try {
      const apiUrl = getApiUrl();
      const endpoint = `${table.tableName}-sync.php`;
      
      const response = await fetch(`${apiUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          userId,
          data: table.data,
          groups: table.groups || []
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Mettre à jour l'état de synchronisation
      this.syncStatus.set(table.tableName, {
        lastSynced: new Date(),
        status: result.success ? 'success' : 'failed'
      });
      
      return result;
    } catch (error) {
      console.error(`Erreur lors de la synchronisation de ${table.tableName}:`, error);
      
      // Mettre à jour l'état de synchronisation
      this.syncStatus.set(table.tableName, {
        lastSynced: null,
        status: 'failed'
      });
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }
  
  async loadDataFromServer<T>(tableName: string, userId?: string): Promise<T[]> {
    try {
      const apiUrl = getApiUrl();
      const endpoint = `${tableName}-load.php`;
      
      const url = new URL(`${apiUrl}/${endpoint}`);
      if (userId) {
        url.searchParams.append('userId', userId);
      }
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Mettre à jour l'état de synchronisation
        this.syncStatus.set(tableName, {
          lastSynced: new Date(),
          status: 'success'
        });
        
        return result.data || [];
      } else {
        throw new Error(result.message || 'Erreur lors du chargement des données');
      }
    } catch (error) {
      console.error(`Erreur lors du chargement des données de ${tableName}:`, error);
      
      // Mettre à jour l'état de synchronisation
      this.syncStatus.set(tableName, {
        lastSynced: null,
        status: 'failed'
      });
      
      throw error;
    }
  }
  
  getSyncStatus(tableName: string) {
    return this.syncStatus.get(tableName) || { lastSynced: null, status: 'pending' };
  }
  
  getLastSynced(tableName: string): Date | null {
    return this.getSyncStatus(tableName).lastSynced;
  }
}

export const syncService = new SyncService();
