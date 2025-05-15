
/**
 * Service de synchronisation simplifié
 * Ce service remplace les implémentations redondantes
 */

import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { toast } from '@/components/ui/use-toast';

// Type pour représenter un tableau de données génériques
export type DataTable<T> = {
  tableName: string;
  data: T[];
};

// Type pour connaître le résultat d'une synchronisation
export type SyncResult = {
  success: boolean;
  message: string;
  count?: number;
};

/**
 * Service centralisé pour synchroniser les données avec le serveur
 */
class SyncService {
  private static instance: SyncService;
  private syncInProgress: Record<string, boolean> = {};
  
  private constructor() {
    // Singleton pattern
    console.log('Service de synchronisation initialisé');
  }
  
  /**
   * Obtient l'instance unique du service de synchronisation
   */
  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }
  
  /**
   * Vérifie si une table est en cours de synchronisation
   */
  public isSyncing(tableName: string): boolean {
    return this.syncInProgress[tableName] === true;
  }
  
  /**
   * Synchronise une table avec le serveur
   */
  public async syncTable<T>(tableName: string, data: T[]): Promise<SyncResult> {
    // Vérifier si une synchronisation est déjà en cours pour cette table
    if (this.isSyncing(tableName)) {
      console.log(`Synchronisation déjà en cours pour ${tableName}`);
      return {
        success: false,
        message: 'Synchronisation déjà en cours'
      };
    }
    
    // Marquer la table comme en cours de synchronisation
    this.syncInProgress[tableName] = true;
    
    try {
      console.log(`Synchronisation de la table ${tableName} (${data.length} éléments)`);
      
      // Obtenir l'utilisateur actuel
      const userId = getCurrentUser() || 'default';
      
      // Construire l'URL de l'API
      const endpoint = `${getApiUrl()}/${tableName}-sync.php`;
      
      // Envoyer les données au serveur
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          [tableName]: data
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`Synchronisation réussie pour ${tableName}`);
        return {
          success: true,
          message: result.message || 'Synchronisation réussie',
          count: result.count || data.length
        };
      } else {
        throw new Error(result.message || 'Échec de la synchronisation');
      }
    } catch (error) {
      console.error(`Erreur lors de la synchronisation de ${tableName}:`, error);
      
      // Afficher une notification d'erreur
      toast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: "destructive"
      });
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    } finally {
      // Marquer la table comme n'étant plus en cours de synchronisation
      this.syncInProgress[tableName] = false;
    }
  }
  
  /**
   * Récupère des données depuis le serveur
   */
  public async fetchData<T>(endpoint: string): Promise<T[]> {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${getApiUrl()}/${endpoint}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : (data.data || []);
    } catch (error) {
      console.error(`Erreur lors de la récupération des données:`, error);
      throw error;
    }
  }
}

// Exporter une instance singleton
export const syncService = SyncService.getInstance();

// Pour la compatibilité avec le code existant
export const triggerSync = {
  triggerTableSync: <T>(tableName: string, data: T[]): Promise<SyncResult> => {
    return syncService.syncTable(tableName, data);
  },
  
  isSyncing: (tableName: string): boolean => {
    return syncService.isSyncing(tableName);
  }
};
