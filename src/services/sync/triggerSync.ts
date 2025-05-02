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
  
  // Mécanisme de verrouillage pour éviter les synchronisations simultanées
  _syncLocks: {} as Record<string, { locked: boolean, timestamp: number }>,
  
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
    // Vérifier d'abord dans le stockage local
    const key = `sync_in_progress_${tableName}`;
    const storageLock = localStorage.getItem(key) === 'true';
    
    // Vérifier ensuite dans le mécanisme de verrouillage en mémoire
    const memoryLock = triggerSync._syncLocks[tableName]?.locked === true;
    
    // Si l'un des deux est vrai, considérer que la synchronisation est en cours
    return storageLock || memoryLock;
  },
  
  /**
   * Acquiert un verrou pour la synchronisation
   * Retourne true si le verrou a été acquis, false sinon
   */
  acquireLock: (tableName: string, timeout: number = 30000): boolean => {
    // Vérifier si un verrou existe déjà
    if (triggerSync.isSyncing(tableName)) {
      // Si le verrou existe depuis trop longtemps, le forcer
      const lock = triggerSync._syncLocks[tableName];
      const now = Date.now();
      
      if (lock && now - lock.timestamp > timeout) {
        console.log(`TriggerSync: Forçage du verrou expiré pour ${tableName} (${now - lock.timestamp}ms)`);
        triggerSync.releaseLock(tableName);
      } else {
        console.log(`TriggerSync: Impossible d'acquérir le verrou pour ${tableName}, déjà verrouillé`);
        return false;
      }
    }
    
    // Acquérir le verrou
    triggerSync._syncLocks[tableName] = { locked: true, timestamp: Date.now() };
    localStorage.setItem(`sync_in_progress_${tableName}`, 'true');
    console.log(`TriggerSync: Verrou acquis pour ${tableName}`);
    return true;
  },
  
  /**
   * Libère un verrou de synchronisation
   */
  releaseLock: (tableName: string): void => {
    if (triggerSync._syncLocks[tableName]) {
      triggerSync._syncLocks[tableName] = { locked: false, timestamp: Date.now() };
    }
    localStorage.removeItem(`sync_in_progress_${tableName}`);
    console.log(`TriggerSync: Verrou libéré pour ${tableName}`);
  },
  
  /**
   * Marque une synchronisation comme en cours ou terminée (déprécié, utilisez acquireLock/releaseLock)
   */
  markSyncStatus: (tableName: string, inProgress: boolean): void => {
    if (inProgress) {
      triggerSync.acquireLock(tableName);
    } else {
      triggerSync.releaseLock(tableName);
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
    
    // Vérifier si les tentatives sont trop fréquentes (moins de 10 secondes - augmenté pour plus de sécurité)
    if (now - stats.lastAttempt < 10000 && stats.attemptCount > 0) {
      stats.attemptCount++;
      triggerSync._syncStats[tableName] = stats;
      console.log(`TriggerSync: Tentative trop fréquente pour ${tableName}, limitée à 1 toutes les 10 secondes`);
      return false;
    }
    
    stats.lastAttempt = now;
    stats.attemptCount++;
    triggerSync._syncStats[tableName] = stats;
    
    // Acquérir un verrou pour la synchronisation
    if (!triggerSync.acquireLock(tableName)) {
      console.log(`TriggerSync: Impossible d'acquérir un verrou pour ${tableName}, opération annulée`);
      return false;
    }
    
    try {
      console.log(`TriggerSync: Début de la synchronisation pour ${tableName}`);
      
      const currentUser = getCurrentUser() || 'p71x6d_system';
      console.log(`TriggerSync: Utilisateur courant: ${currentUser}`);
      
      // Génération d'un identifiant unique pour cette tentative de synchronisation
      const syncId = `sync_${tableName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(`last_sync_id_${tableName}`, syncId);
      
      // Synchroniser TOUJOURS avec le serveur en priorité
      const success = await triggerSync.syncWithServer(tableName, data);
      
      // Vérifier que c'est toujours notre synchronisation qui est en cours
      // (éviter les conflits si une autre synchronisation a démarré entre temps)
      const currentSyncId = localStorage.getItem(`last_sync_id_${tableName}`);
      if (currentSyncId !== syncId) {
        console.log(`TriggerSync: Une autre synchronisation a démarré pour ${tableName}, annulation du traitement`);
        return false;
      }
      
      if (success) {
        // Si la synchronisation serveur a réussi, mettre à jour les statistiques
        stats.successCount++;
        console.log(`TriggerSync: Synchronisation réussie pour ${tableName}`);
        
        // APRÈS la synchronisation serveur réussie, sauvegarder dans localStorage pour le mode hors ligne
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
        
        // Sauvegarder quand même dans localStorage pour éviter la perte de données
        localStorage.setItem(`${tableName}_${currentUser}`, JSON.stringify(data));
        
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
      
      // Sauvegarder quand même dans localStorage pour éviter la perte de données
      const currentUser = getCurrentUser() || 'p71x6d_system';
      localStorage.setItem(`${tableName}_${currentUser}`, JSON.stringify(data));
      
      // Diffuser un événement indiquant que la synchronisation a échoué
      window.dispatchEvent(new CustomEvent("syncError", { 
        detail: { tableName, error: error instanceof Error ? error.message : String(error) }
      }));
      
      return false;
    } finally {
      // Libérer le verrou de synchronisation
      triggerSync.releaseLock(tableName);
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
   * Notifie qu'une table a été modifiée et déclenche une synchronisation immédiate si possible
   */
  notifyDataChange: <T>(tableName: string, data: T[]) => {
    const currentUser = getCurrentUser() || 'p71x6d_system';
    
    // Identifiant unique pour cette notification
    const notificationId = `${tableName}_${Date.now()}`;
    const lastNotificationId = localStorage.getItem(`last_notification_${tableName}`);
    
    // Vérifier si une notification identique a été déclenchée récemment (moins de 5 secondes)
    if (lastNotificationId) {
      const lastNotificationTime = parseInt(lastNotificationId.split('_')[1], 10);
      if (Date.now() - lastNotificationTime < 5000) {
        console.log(`TriggerSync: Notification similaire récente pour ${tableName}, opération ignorée`);
        return;
      }
    }
    
    // Enregistrer cette notification
    localStorage.setItem(`last_notification_${tableName}`, notificationId);
    
    // IMPORTANT: Sauvegarder d'abord localement pour éviter la perte de données
    localStorage.setItem(`${tableName}_${currentUser}`, JSON.stringify(data));
    
    // Marquer comme en attente de synchronisation
    localStorage.setItem(`sync_pending_${tableName}`, new Date().toISOString());
    
    // TENTER UNE SYNCHRONISATION IMMÉDIATE avec le serveur si en ligne
    if (window.navigator.onLine && !triggerSync.isSyncing(tableName)) {
      console.log(`TriggerSync: Tentative de synchronisation immédiate après modification pour ${tableName}`);
      
      // Déclencher la synchronisation après un court délai pour éviter les appels trop fréquents
      // Et permettre à plusieurs modifications d'être regroupées
      setTimeout(() => {
        // Vérifier qu'aucune synchronisation n'est en cours avant de démarrer
        if (!triggerSync.isSyncing(tableName)) {
          triggerSync.triggerTableSync(tableName, data).catch(error => {
            console.error(`TriggerSync: Erreur lors de la synchronisation après notification:`, error);
          });
        } else {
          console.log(`TriggerSync: Synchronisation déjà en cours pour ${tableName}, notification ignorée`);
        }
      }, 2000); // Attendre 2 secondes (augmenté pour regrouper les modifications)
    } else {
      console.log(`TriggerSync: Mode hors ligne ou synchronisation en cours, synchronisation différée pour ${tableName}`);
    }
  },
  
  /**
   * Tente de synchroniser toutes les données en attente
   */
  synchronizeAllPending: async (): Promise<Record<string, boolean>> => {
    console.log("TriggerSync: Tentative de synchronisation de toutes les données en attente");
    
    const results: Record<string, boolean> = {};
    const pendingKeys = Object.keys(localStorage).filter(key => key.startsWith('sync_pending_'));
    
    if (pendingKeys.length === 0) {
      console.log("TriggerSync: Aucune synchronisation en attente");
      return results;
    }
    
    console.log(`TriggerSync: ${pendingKeys.length} synchronisations en attente`);
    
    for (const key of pendingKeys) {
      const tableName = key.replace('sync_pending_', '');
      const currentUser = getCurrentUser() || 'p71x6d_system';
      const dataKey = `${tableName}_${currentUser}`;
      
      const storedData = localStorage.getItem(dataKey);
      if (!storedData) {
        console.log(`TriggerSync: Aucune donnée à synchroniser pour ${tableName}`);
        results[tableName] = true; // Rien à faire, considéré comme un succès
        localStorage.removeItem(key); // Supprimer le marqueur de synchronisation en attente
        continue;
      }
      
      try {
        const data = JSON.parse(storedData);
        
        console.log(`TriggerSync: Synchronisation en cours pour ${tableName}`);
        const success = await triggerSync.triggerTableSync(tableName, data);
        
        results[tableName] = success;
        
        if (success) {
          console.log(`TriggerSync: Synchronisation réussie pour ${tableName}`);
          localStorage.removeItem(key);
        }
      } catch (error) {
        console.error(`TriggerSync: Erreur lors de la synchronisation de ${tableName}:`, error);
        results[tableName] = false;
      }
    }
    
    return results;
  }
};
