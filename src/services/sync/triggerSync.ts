
/**
 * Service pour déclencher la synchronisation des données
 * Service unifié pour toute l'application
 */
import { dataSyncManager } from './DataSyncManager';

export const triggerSync = {
  /**
   * Déclenche une synchronisation immédiate pour une table spécifique
   * @param tableName Nom de la table à synchroniser
   * @param data Données à synchroniser
   * @returns Promise<boolean> indiquant le succès de l'opération
   */
  triggerTableSync: async <T>(tableName: string, data: T[]): Promise<boolean> => {
    console.log(`TriggerSync: Déclenchement de la synchronisation pour ${tableName} (${data?.length || 0} éléments)`);
    
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
      return result.success;
    } catch (error) {
      console.error(`TriggerSync: Erreur lors de la synchronisation de ${tableName}:`, error);
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
    
    // Vérifier si la table doit être mappée (ancien nom vers nouveau nom)
    const tableMappings: Record<string, string> = {
      'bibliotheque': 'collaboration'
    };
    
    // Utiliser le nom correct de la table pour le stockage
    const actualTableName = tableMappings[tableName] || tableName;
    
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
      localStorage.setItem('sync_pending_' + actualTableName, new Date().toISOString());
      
      // Si c'est un nom mappé, également ajouter sous l'ancien nom
      if (actualTableName !== tableName) {
        localStorage.setItem('sync_pending_' + tableName, new Date().toISOString());
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
  },
  
  /**
   * Vérifie s'il y a des données en attente de synchronisation
   * @returns true s'il y a des données en attente
   */
  hasPendingChanges: (): boolean => {
    // Parcourir le localStorage pour trouver des indicateurs de synchronisation en attente
    const pendingKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('sync_pending_') || key.startsWith('pending_sync_')
    );
    
    return pendingKeys.length > 0;
  }
};
