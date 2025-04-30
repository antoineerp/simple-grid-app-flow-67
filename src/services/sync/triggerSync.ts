
/**
 * Service pour déclencher la synchronisation des données
 * Service unifié pour toute l'application
 */
import { dataSyncManager } from './DataSyncManager';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { toast } from '@/components/ui/use-toast';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

interface SyncStats {
  attemptCount: number;
  lastAttempt: number;
  successCount: number;
  failureCount: number;
}

export const triggerSync = {
  // Statistiques pour éviter les boucles de synchronisation
  _syncStats: {} as Record<string, SyncStats>,
  
  /**
   * Réinitialise les statistiques de synchronisation
   */
  resetStats: () => {
    console.log("Réinitialisation des statistiques de synchronisation");
    triggerSync._syncStats = {};
  },
  
  /**
   * Vérifie si une synchronisation est en cours
   */
  isSyncing: (tableName: string): boolean => {
    const key = `sync_in_progress_${tableName}`;
    return localStorage.getItem(key) === 'true';
  },
  
  /**
   * Marque une synchronisation comme en cours ou terminée
   */
  markSyncStatus: (tableName: string, inProgress: boolean): void => {
    const key = `sync_in_progress_${tableName}`;
    if (inProgress) {
      localStorage.setItem(key, 'true');
    } else {
      localStorage.removeItem(key);
    }
  },
  
  /**
   * Obtient les statistiques de synchronisation pour une table
   */
  getStats: (tableName: string): SyncStats => {
    if (!triggerSync._syncStats[tableName]) {
      triggerSync._syncStats[tableName] = {
        attemptCount: 0,
        lastAttempt: 0,
        successCount: 0,
        failureCount: 0
      };
    }
    return triggerSync._syncStats[tableName];
  },
  
  /**
   * Déclenche une synchronisation immédiate pour une table spécifique
   * @param tableName Nom de la table à synchroniser
   * @param data Données à synchroniser
   * @returns Promise<boolean> indiquant le succès de l'opération
   */
  triggerTableSync: async <T>(tableName: string, data: T[]): Promise<boolean> => {
    console.log(`TriggerSync: Déclenchement de la synchronisation pour ${tableName} (${data?.length || 0} éléments)`);
    
    // Éviter la synchronisation si déjà en cours
    if (triggerSync.isSyncing(tableName)) {
      console.log(`TriggerSync: Synchronisation déjà en cours pour ${tableName}, opération ignorée`);
      return false;
    }
    
    // Ne pas synchroniser s'il n'y a pas de données
    if (!data || data.length === 0) {
      console.log(`TriggerSync: Aucune donnée à synchroniser pour ${tableName}, opération annulée`);
      return true; // On considère que c'est un succès car il n'y a rien à faire
    }
    
    // Mettre à jour les statistiques
    const stats = triggerSync.getStats(tableName);
    const now = Date.now();
    
    // Vérifier si les tentatives sont trop fréquentes (moins de 5 secondes)
    if (now - stats.lastAttempt < 5000 && stats.attemptCount > 0) {
      stats.attemptCount++;
      triggerSync._syncStats[tableName] = stats;
      console.log(`TriggerSync: Tentative trop fréquente pour ${tableName}, limitée à 1 toutes les 5 secondes`);
      return false;
    }
    
    stats.lastAttempt = now;
    stats.attemptCount++;
    triggerSync._syncStats[tableName] = stats;
    
    // Marquer la synchronisation comme en cours
    triggerSync.markSyncStatus(tableName, true);
    
    try {
      console.log(`TriggerSync: Début de la synchronisation pour ${tableName}`);
      
      const currentUser = getCurrentUser() || 'p71x6d_system';
      console.log(`TriggerSync: Utilisateur courant: ${currentUser}`);
      
      // Synchroniser avec le serveur
      const success = await triggerSync.syncWithServer(tableName, data);
      
      if (success) {
        // Si la synchronisation serveur a réussi, mettre à jour les statistiques
        stats.successCount++;
        console.log(`TriggerSync: Synchronisation réussie pour ${tableName}`);
        
        // Sauvegarder aussi dans le localStorage pour le mode hors ligne
        localStorage.setItem(`${tableName}_${currentUser}`, JSON.stringify(data));
        localStorage.removeItem(`sync_pending_${tableName}`);
        
        // Enregistrer la date de la dernière synchronisation réussie
        const syncTime = new Date().toISOString();
        localStorage.setItem(`last_synced_${tableName}`, syncTime);
        
        // Diffuser un événement indiquant que la synchronisation est terminée
        window.dispatchEvent(new CustomEvent("syncComplete", { 
          detail: { tableName, success: true, timestamp: syncTime }
        }));
      } else {
        // Si la synchronisation a échoué, incrémenter le compteur d'échecs
        stats.failureCount++;
        console.log(`TriggerSync: Échec de la synchronisation pour ${tableName}`);
        
        // Marquer comme en attente de synchronisation
        localStorage.setItem(`sync_pending_${tableName}`, new Date().toISOString());
        
        // Diffuser un événement indiquant que la synchronisation a échoué
        window.dispatchEvent(new CustomEvent("syncError", { 
          detail: { tableName, timestamp: new Date().toISOString() }
        }));
      }
      
      triggerSync._syncStats[tableName] = stats;
      
      return success;
    } catch (error) {
      console.error(`TriggerSync: Erreur lors de la synchronisation de ${tableName}:`, error);
      
      // Mettre à jour les statistiques en cas d'erreur
      stats.failureCount++;
      triggerSync._syncStats[tableName] = stats;
      
      // Marquer comme en attente de synchronisation
      localStorage.setItem(`sync_pending_${tableName}`, new Date().toISOString());
      
      // Diffuser un événement indiquant que la synchronisation a échoué
      window.dispatchEvent(new CustomEvent("syncError", { 
        detail: { tableName, error: error instanceof Error ? error.message : String(error) }
      }));
      
      return false;
    } finally {
      // Marquer la synchronisation comme terminée
      triggerSync.markSyncStatus(tableName, false);
    }
  },
  
  /**
   * Synchronisation directe avec le serveur
   */
  syncWithServer: async <T>(tableName: string, data: T[]): Promise<boolean> => {
    try {
      const currentUser = getCurrentUser() || 'p71x6d_system';
      const API_URL = getApiUrl();
      const endpoint = `${API_URL}/${tableName}-sync.php`;
      
      console.log(`TriggerSync: Envoi des données à ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUser,
          [tableName]: data
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`TriggerSync: Erreur HTTP ${response.status}: ${errorText}`);
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      console.log(`TriggerSync: Réponse du serveur:`, result);
      
      if (result.success === true) {
        return true;
      } else {
        throw new Error(result.message || "Échec de la synchronisation");
      }
    } catch (error) {
      console.error(`TriggerSync: Erreur lors de la synchronisation avec le serveur pour ${tableName}:`, error);
      
      // Essayer l'URL alternative si la première échoue
      try {
        const currentUser = getCurrentUser() || 'p71x6d_system';
        const apiAltUrl = `/sites/qualiopi.ch/api`;
        const endpoint = `${apiAltUrl}/${tableName}-sync.php`;
        
        console.log(`TriggerSync: Tentative avec URL alternative: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: currentUser,
            [tableName]: data
          })
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP alternative ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success === true) {
          console.log(`TriggerSync: Synchronisation alternative réussie pour ${tableName}`);
          return true;
        } else {
          throw new Error(result.message || "Échec de la synchronisation alternative");
        }
      } catch (err) {
        console.error(`TriggerSync: Échec de la synchronisation alternative pour ${tableName}:`, err);
        throw error; // Rethrow l'erreur originale
      }
    }
  },
  
  /**
   * Vérifie s'il y a des synchronisations en attente
   */
  hasPendingChanges: (): boolean => {
    const keys = Object.keys(localStorage);
    return keys.some(key => key.startsWith('sync_pending_'));
  },
  
  /**
   * Notifie qu'une table a été modifiée
   */
  notifyDataChange: <T>(tableName: string, data: T[]) => {
    const currentUser = getCurrentUser() || 'p71x6d_system';
    
    // Sauvegarder localement
    localStorage.setItem(`${tableName}_${currentUser}`, JSON.stringify(data));
    
    // Marquer comme en attente de synchronisation
    localStorage.setItem(`sync_pending_${tableName}`, new Date().toISOString());
    
    // Diffuser un événement
    window.dispatchEvent(new CustomEvent("dataChange", { 
      detail: { tableName, dataCount: data.length }
    }));
  },
  
  /**
   * Synchronise toutes les tables ayant des modifications en attente
   */
  synchronizeAllPending: async (): Promise<Record<string, boolean>> => {
    console.log("TriggerSync: Synchronisation de toutes les tables avec des modifications en attente");
    
    const results: Record<string, boolean> = {};
    const pendingKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('sync_pending_'))
      .map(key => key.replace('sync_pending_', ''));
    
    if (pendingKeys.length === 0) {
      console.log("TriggerSync: Aucune synchronisation en attente");
      return results;
    }
    
    console.log(`TriggerSync: ${pendingKeys.length} synchronisations en attente: ${pendingKeys.join(', ')}`);
    
    const currentUser = getCurrentUser() || 'p71x6d_system';
    
    for (const tableName of pendingKeys) {
      try {
        const storedData = localStorage.getItem(`${tableName}_${currentUser}`);
        
        if (storedData) {
          const data = JSON.parse(storedData);
          
          if (Array.isArray(data) && data.length > 0) {
            console.log(`TriggerSync: Synchronisation de ${tableName} (${data.length} éléments)`);
            results[tableName] = await triggerSync.triggerTableSync(tableName, data);
          } else {
            console.log(`TriggerSync: Pas de données valides pour ${tableName}, suppression de la marque en attente`);
            localStorage.removeItem(`sync_pending_${tableName}`);
            results[tableName] = true;
          }
        } else {
          console.log(`TriggerSync: Aucune donnée pour ${tableName}, suppression de la marque en attente`);
          localStorage.removeItem(`sync_pending_${tableName}`);
          results[tableName] = true;
        }
      } catch (error) {
        console.error(`TriggerSync: Erreur lors de la synchronisation de ${tableName}:`, error);
        results[tableName] = false;
      }
    }
    
    return results;
  }
};
