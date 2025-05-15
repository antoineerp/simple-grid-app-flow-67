
/**
 * Service de synchronisation centralisé
 */

import { toast } from "@/hooks/use-toast";
import { triggerSync, triggerSyncAll } from './triggerSync';

/**
 * Déclenche une synchronisation pour un type d'entité spécifique
 * @param entityType Le type d'entité à synchroniser (ex: 'membres', 'documents')
 */
export const startEntitySync = async (entityType: string): Promise<boolean> => {
  try {
    console.log(`Démarrage de la synchronisation pour: ${entityType}`);
    // Ici, on pourrait appeler une API pour déclencher la synchro
    // Simulation d'une API réussie
    await new Promise(resolve => setTimeout(resolve, 1500));
    return true;
  } catch (error) {
    console.error(`Erreur lors de la synchronisation ${entityType}:`, error);
    toast({
      title: "Échec de la synchronisation",
      description: `Impossible de synchroniser les ${entityType}.`,
      variant: "destructive"
    });
    return false;
  }
};

/**
 * Récupère le statut de la dernière synchronisation
 * @param entityType Le type d'entité
 */
export const getSyncStatus = async (entityType: string) => {
  try {
    // Simulation d'une API
    return {
      lastSync: new Date(),
      status: "success"
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du statut de synchronisation:", error);
    return {
      lastSync: null,
      status: "error"
    };
  }
};

// Export needed functions from triggerSync.ts
export { triggerSync, triggerSyncAll };

// Add the triggerTableSync function
export const triggerTableSync = async (tableName: string): Promise<boolean> => {
  return triggerSync(tableName);
};

// Add syncService object for compatibility
export const syncService = {
  syncTable: async (tableName: string) => {
    try {
      const result = await triggerSync(tableName);
      return { success: result };
    } catch (error) {
      console.error(`Error syncing table ${tableName}:`, error);
      return { success: false, error };
    }
  }
};
