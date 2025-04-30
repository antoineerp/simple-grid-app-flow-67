
/**
 * Service pour déclencher la synchronisation des données
 * Service unifié pour toute l'application
 */
import { dataSyncManager } from './DataSyncManager';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { toast } from '@/components/ui/use-toast';

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
    if (now - stats.lastAttempt < 5000 && stats.attemptCount > 3) {
      console.warn(`TriggerSync: Tentatives trop fréquentes pour ${tableName}, opération reportée`);
      return false;
    }
    
    // Mise à jour des statistiques
    stats.attemptCount++;
    stats.lastAttempt = now;
    
    // Marquer comme en cours
    triggerSync.markSyncStatus(tableName, true);
    
    try {
      // Sauvegarder les données localement d'abord pour éviter toute perte
      dataSyncManager.saveLocalData(tableName, data);
      
      // Vérifier si la table doit être mappée (ancien nom vers nouveau nom)
      const tableMappings: Record<string, string> = {
        'bibliotheque': 'collaboration'
      };
      
      // Utiliser le nom correct de la table pour la synchronisation
      const actualTableName = tableMappings[tableName] || tableName;
      
      if (actualTableName !== tableName) {
        console.log(`TriggerSync: Redirection de "${tableName}" vers "${actualTableName}"`);
      }
      
      // Effectuer la synchronisation
      const result = await dataSyncManager.syncTable(actualTableName, data);
      
      // Mettre à jour les statistiques
      if (result.success) {
        stats.successCount++;
      } else {
        stats.failureCount++;
      }
      
      // Marquer comme terminée
      triggerSync.markSyncStatus(tableName, false);
      
      return result.success;
    } catch (error) {
      console.error(`TriggerSync: Erreur lors de la synchronisation de ${tableName}:`, error);
      
      // Mettre à jour les statistiques
      stats.failureCount++;
      
      // Marquer comme terminée
      triggerSync.markSyncStatus(tableName, false);
      
      return false;
    }
  },
  
  /**
   * Notifie qu'une modification a été faite et doit être synchronisée
   * Cette méthode est plus légère et ne déclenche pas de synchronisation immédiate
   * @param tableName Nom de la table concernée
   * @param data Données modifiées
   */
  notifyDataChange: <T>(tableName: string, data: T[]): void => {
    console.log(`TriggerSync: Notification de changement de données pour ${tableName}`);
    
    // Ne pas continuer s'il n'y a pas de données
    if (!data || data.length === 0) {
      console.log(`TriggerSync: Aucune donnée à notifier pour ${tableName}, opération annulée`);
      return;
    }
    
    // Vérifier si la table doit être mappée (ancien nom vers nouveau nom)
    const tableMappings: Record<string, string> = {
      'bibliotheque': 'collaboration'
    };
    
    // Utiliser le nom correct de la table pour le stockage
    const actualTableName = tableMappings[tableName] || tableName;
    
    // Utiliser l'utilisateur courant pour le stockage
    const userId = getCurrentUser() || 'default';
    
    // Sauvegarder les données localement
    dataSyncManager.saveLocalData(actualTableName, data);
    
    // Sauvegarder aussi sous l'ancien nom si c'est un nom mappé
    if (actualTableName !== tableName) {
      console.log(`TriggerSync: Sauvegarde sous l'ancien nom "${tableName}" également`);
      dataSyncManager.saveLocalData(tableName, data);
    }
    
    // Émettre un événement pour le GlobalSyncManager
    const event = new CustomEvent('dataUpdate', {
      detail: {
        table: actualTableName,
        data: data,
        timestamp: new Date().getTime()
      }
    });
    
    window.dispatchEvent(event);
    
    // Ajouter un indicateur dans le localStorage pour que d'autres onglets soient informés
    try {
      // Utiliser une clé spécifique à l'utilisateur
      localStorage.setItem(`sync_pending_${actualTableName}_${userId}`, new Date().toISOString());
      
      // Si c'est un nom mappé, également ajouter sous l'ancien nom
      if (actualTableName !== tableName) {
        localStorage.setItem(`sync_pending_${tableName}_${userId}`, new Date().toISOString());
      }
    } catch (e) {
      console.error("Erreur lors de l'enregistrement de l'indicateur de synchronisation:", e);
    }
  },
  
  /**
   * Déclenche une synchronisation de toutes les données en attente
   * @returns Promise avec les résultats de synchronisation par table
   */
  synchronizeAllPending: async (): Promise<Record<string, boolean>> => {
    console.log("TriggerSync: Déclenchement de la synchronisation de toutes les données en attente");
    
    try {
      // Si des synchronisations sont en cours, annuler
      const tablesInProgress = triggerSync.getTablesInSync();
      if (tablesInProgress.length > 0) {
        console.log(`TriggerSync: Synchronisations déjà en cours pour: ${tablesInProgress.join(', ')}`);
        return {};
      }
      
      const results = await dataSyncManager.syncAllPendingChanges();
      
      // Convertir les résultats en un objet simple true/false
      const simplifiedResults: Record<string, boolean> = {};
      
      for (const [tableName, result] of Object.entries(results)) {
        simplifiedResults[tableName] = result.success;
      }
      
      if (Object.keys(simplifiedResults).length === 0) {
        toast({
          title: "Aucune donnée à synchroniser",
          description: "Toutes les données sont déjà synchronisées avec le serveur."
        });
      } else {
        // Déterminer si tout a réussi ou s'il y a eu des échecs
        const failedCount = Object.values(simplifiedResults).filter(result => !result).length;
        
        if (failedCount > 0) {
          toast({
            variant: "warning",
            title: "Synchronisation partielle",
            description: `${failedCount} table(s) n'ont pas pu être synchronisées.`
          });
        } else {
          toast({
            title: "Synchronisation réussie",
            description: `${Object.keys(simplifiedResults).length} table(s) synchronisée(s) avec succès.`
          });
        }
      }
      
      return simplifiedResults;
    } catch (error) {
      console.error("TriggerSync: Erreur lors de la synchronisation des données en attente:", error);
      
      toast({
        variant: "destructive",
        title: "Erreur de synchronisation",
        description: "Une erreur est survenue lors de la synchronisation des données."
      });
      
      return {};
    }
  },
  
  /**
   * Vérifie s'il y a des données en attente de synchronisation
   * @returns true s'il y a des données en attente
   */
  hasPendingChanges: (): boolean => {
    // Récupérer l'utilisateur courant
    const userId = getCurrentUser() || 'default';
    
    // Parcourir le localStorage pour trouver des indicateurs de synchronisation en attente
    const pendingKeys = Object.keys(localStorage).filter(key => 
      (key.startsWith('sync_pending_') || key.startsWith('pending_sync_')) &&
      (key.includes(`_${userId}`) || !key.includes('_'))
    );
    
    return pendingKeys.length > 0;
  },
  
  /**
   * Obtient la liste des tables en cours de synchronisation
   */
  getTablesInSync: (): string[] => {
    return Object.keys(localStorage)
      .filter(key => key.startsWith('sync_in_progress_'))
      .map(key => key.replace('sync_in_progress_', ''));
  }
};
