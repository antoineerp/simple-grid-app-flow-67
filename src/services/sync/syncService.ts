
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { toast } from '@/components/ui/use-toast';

// Type for generic data table
export type DataTable<T> = {
  tableName: string;
  data: T[];
  groups?: any[];
};

// Type for sync result
export type SyncResult = {
  success: boolean;
  message: string;
  count?: number;
  timestamp?: string;
};

// Service object that can be imported by other modules
export const syncService = {
  // Fonction principale pour synchroniser des données avec le serveur
  syncDataWithServer: async <T>(
    endpoint: string,
    data: T[],
    options: { showToast?: boolean; userId?: string } = {}
  ): Promise<SyncResult> => {
    try {
      const API_URL = getApiUrl();
      const userId = options.userId || getCurrentUser();
      
      console.log(`SyncService: Synchronisation de ${endpoint} avec l'utilisateur ${userId} (${data.length} éléments)`);
      
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          data,
          timestamp: new Date().toISOString()
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
      
      return {
        success: result.success || false,
        message: result.message || "Synchronisation réussie",
        count: result.count || data.length,
        timestamp: result.timestamp || new Date().toISOString()
      };
    } catch (error) {
      console.error(`Erreur lors de la synchronisation avec ${endpoint}:`, error);
      
      if (options.showToast) {
        toast({
          variant: "destructive",
          title: "Erreur de synchronisation",
          description: "Impossible de synchroniser les données avec le serveur."
        });
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erreur inconnue",
        timestamp: new Date().toISOString()
      };
    }
  },

  // Charge des données depuis le serveur
  loadDataFromServer: async <T>(
    endpoint: string, 
    userId?: string
  ): Promise<{ data: T[]; success: boolean; message: string }> => {
    try {
      const API_URL = getApiUrl();
      const currentUser = userId || getCurrentUser();
      
      console.log(`SyncService: Chargement des données depuis ${endpoint} pour l'utilisateur ${currentUser}`);
      
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

      const result = await response.json();
      return {
        data: result.data || [],
        success: true,
        message: "Données chargées avec succès"
      };
    } catch (error) {
      console.error(`Erreur lors du chargement depuis ${endpoint}:`, error);
      return {
        data: [],
        success: false,
        message: error instanceof Error ? error.message : "Erreur inconnue"
      };
    }
  },
  
  // Récupérer la date de dernière synchronisation
  getLastSynced: (tableId: string): Date | null => {
    const key = `last_synced_${tableId}`;
    const storedDate = localStorage.getItem(key);
    return storedDate ? new Date(storedDate) : null;
  },
  
  // Définir la date de dernière synchronisation
  setLastSynced: (tableId: string, date: Date = new Date()): void => {
    const key = `last_synced_${tableId}`;
    localStorage.setItem(key, date.toISOString());
  },

  // Méthode unifiée pour synchroniser une table
  syncTable: async <T>(
    tableName: string,
    data: T[],
    userId?: string | null,
    trigger: "auto" | "manual" | "initial" = "auto"
  ): Promise<SyncResult> => {
    try {
      // Stocker les infos de synchronisation
      localStorage.setItem(`sync_trigger_${tableName}`, trigger);
      localStorage.setItem(`sync_pending_${tableName}`, 'true');
      
      console.log(`SyncService: Synchronisation ${trigger} de ${tableName} demandée avec ${data?.length || 0} éléments`);
      
      const validUserId = userId || getCurrentUser();
      
      // Synchronisation temps réel - sauvegarder localement d'abord
      localStorage.setItem(`data_${validUserId}_${tableName}`, JSON.stringify(data));
      
      // Effectuer la synchronisation avec le serveur
      const API_URL = getApiUrl();
      
      const response = await fetch(`${API_URL}/robust-sync.php`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: validUserId,
          tableName,
          records: data,
          syncMode: 'full',  // Mode de synchronisation complète
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Mettre à jour la date de dernière synchronisation
      if (result.success) {
        syncService.setLastSynced(tableName);
      }
      
      // Effacer le marqueur de synchronisation en cours
      localStorage.removeItem(`sync_pending_${tableName}`);
      
      return {
        success: result.success,
        message: result.message || "Synchronisation réussie",
        count: result.count || data.length,
        timestamp: result.timestamp
      };
      
    } catch (error) {
      // Gestion des erreurs
      console.error(`Erreur lors de la synchronisation de ${tableName}:`, error);
      
      localStorage.setItem(`sync_failed_${tableName}`, JSON.stringify({
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Erreur inconnue"
      }));
      
      // Effacer le marqueur de synchronisation en cours
      localStorage.removeItem(`sync_pending_${tableName}`);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erreur inconnue",
        timestamp: new Date().toISOString()
      };
    }
  },
  
  // Méthode pour charger des données locales
  getLocalData: <T>(tableName: string, userId?: string): T[] => {
    const currentUser = userId || getCurrentUser();
    const key = `data_${currentUser}_${tableName}`;
    
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Erreur lors du chargement des données locales ${tableName}:`, error);
      return [];
    }
  },
  
  // Méthode pour enregistrer des données locales
  saveLocalData: <T>(tableName: string, data: T[], userId?: string): void => {
    const currentUser = userId || getCurrentUser();
    const key = `data_${currentUser}_${tableName}`;
    
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde des données locales ${tableName}:`, error);
    }
  }
};

// Fonctions exportées pour une utilisation simplifiée
export const syncData = syncService.syncDataWithServer;
export const loadData = syncService.loadDataFromServer;
export const getLocalData = syncService.getLocalData;
export const saveLocalData = syncService.saveLocalData;
export const syncTable = syncService.syncTable;

// Sauvegarde des données (localement et avec le serveur si possible)
export const saveData = async <T>(
  key: string,
  data: T[],
  options: { syncWithServer?: boolean, endpoint?: string, userId?: string } = {}
): Promise<boolean> => {
  try {
    const currentUser = options.userId || getCurrentUser();
    
    // Sauvegarde locale
    syncService.saveLocalData(key, data, currentUser);
    
    // Synchronisation avec le serveur si demandé
    if (options.syncWithServer && options.endpoint) {
      const result = await syncService.syncDataWithServer(options.endpoint, data, { userId: currentUser });
      return result.success;
    }
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde des données ${key}:`, error);
    return false;
  }
};
