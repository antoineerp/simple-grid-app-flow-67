
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { getCurrentUser } from '../core/databaseConnectionService';
import { toast } from '@/components/ui/use-toast';

// Service object that can be imported by other modules
export const syncService = {
  // Fonction pour synchroniser des données avec le serveur
  syncDataWithServer: async <T>(
    endpoint: string,
    data: T[],
    options: { showToast?: boolean } = {}
  ): Promise<boolean> => {
    try {
      const API_URL = getApiUrl();
      const userId = getCurrentUser();
      
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          data
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (options.showToast && result.success) {
        toast({
          title: "Synchronisation réussie",
          description: "Les données ont été synchronisées avec le serveur."
        });
      }
      
      return result.success;
    } catch (error) {
      console.error(`Erreur lors de la synchronisation avec ${endpoint}:`, error);
      
      if (options.showToast) {
        toast({
          variant: "destructive",
          title: "Erreur de synchronisation",
          description: "Impossible de synchroniser les données avec le serveur."
        });
      }
      
      return false;
    }
  },

  // Charge des données depuis le serveur
  loadDataFromServer: async <T>(
    endpoint: string, 
    userId?: string
  ): Promise<T[]> => {
    try {
      const API_URL = getApiUrl();
      const currentUser = userId || getCurrentUser();
      
      const response = await fetch(`${API_URL}/${endpoint}?userId=${currentUser}`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error(`Erreur lors du chargement depuis ${endpoint}:`, error);
      return [];
    }
  },
  
  // Récupérer la date de dernière synchronisation
  getLastSynced: (tableId: string): Date | null => {
    const key = `last_synced_${tableId}`;
    const storedDate = localStorage.getItem(key);
    return storedDate ? new Date(storedDate) : null;
  },
  
  // Définir la date de dernière synchronisation
  setLastSynced: (tableId: string, date: Date): void => {
    const key = `last_synced_${tableId}`;
    localStorage.setItem(key, date.toISOString());
  }
};

// Fonction pour synchroniser des données avec le serveur
export const syncData = async <T>(
  endpoint: string,
  data: T[],
  options: { showToast?: boolean } = {}
): Promise<boolean> => {
  return syncService.syncDataWithServer(endpoint, data, options);
};

// Charge des données depuis le serveur
export const loadData = async <T>(endpoint: string): Promise<T[]> => {
  return syncService.loadDataFromServer(endpoint);
};

// Sauvegarde des données (localement et avec le serveur si possible)
export const saveData = async <T>(
  key: string,
  data: T[],
  options: { syncWithServer?: boolean, endpoint?: string } = {}
): Promise<boolean> => {
  try {
    // Sauvegarde locale
    localStorage.setItem(`data_${getCurrentUser()}_${key}`, JSON.stringify(data));
    
    // Synchronisation avec le serveur si demandé
    if (options.syncWithServer && options.endpoint) {
      return await syncData(options.endpoint, data);
    }
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde des données ${key}:`, error);
    return false;
  }
};
