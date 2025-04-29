
/**
 * Service pour déclencher la synchronisation des données
 */
import { dataSyncManager } from './DataSyncManager';

export const triggerSync = {
  /**
   * Déclenche une synchronisation immédiate pour une table spécifique
   */
  triggerTableSync: async <T>(tableName: string, data: T[]): Promise<boolean> => {
    console.log(`TriggerSync: Déclenchement de la synchronisation pour ${tableName}`);
    
    try {
      const result = await dataSyncManager.syncTable(tableName, data);
      return result.success;
    } catch (error) {
      console.error(`TriggerSync: Erreur lors de la synchronisation de ${tableName}:`, error);
      return false;
    }
  },
  
  /**
   * Notifie qu'une modification a été faite et doit être synchronisée
   */
  notifyDataChange: <T>(tableName: string, data: T[]): void => {
    console.log(`TriggerSync: Notification de changement de données pour ${tableName}`);
    
    // Sauvegarder les données localement
    dataSyncManager.saveLocalData(tableName, data);
    
    // Émettre un événement pour le GlobalSyncManager
    const event = new CustomEvent('dataUpdate', {
      detail: {
        table: tableName,
        data: data
      }
    });
    
    window.dispatchEvent(event);
  },
  
  /**
   * Déclenche une synchronisation de toutes les données en attente
   */
  synchronizeAllPending: async (): Promise<Record<string, boolean>> => {
    console.log("TriggerSync: Déclenchement de la synchronisation de toutes les données en attente");
    
    try {
      const results = await dataSyncManager.syncAllPendingChanges();
      
      // Convertir les résultats en un objet simple true/false
      const simplifiedResults: Record<string, boolean> = {};
      
      for (const [tableName, result] of Object.entries(results)) {
        simplifiedResults[tableName] = result.success;
      }
      
      return simplifiedResults;
    } catch (error) {
      console.error("TriggerSync: Erreur lors de la synchronisation des données en attente:", error);
      return {};
    }
  }
};
