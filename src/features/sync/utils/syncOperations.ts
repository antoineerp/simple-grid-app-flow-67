
/**
 * Opérations de synchronisation communes
 */

import { syncService } from '@/services/sync';

export const syncTable = async (tableName: string, data: any[] = []): Promise<boolean> => {
  console.log(`Synchronisation de la table ${tableName} avec ${data.length} enregistrements`);
  
  try {
    // Si des données sont fournies, nous les synchronisons
    if (data.length > 0) {
      const result = await syncService.syncTable(tableName);
      return result.success;
    } 
    // Sinon nous faisons juste un ping de synchronisation
    else {
      const result = await syncService.syncTable(tableName);
      return result.success;
    }
  } catch (error) {
    console.error(`Erreur lors de la synchronisation de la table ${tableName}:`, error);
    return false;
  }
};

export const fetchSyncedData = async <T>(tableName: string): Promise<T[] | null> => {
  try {
    return await syncService.fetchData<T>(tableName);
  } catch (error) {
    console.error(`Erreur lors du chargement des données synchronisées pour ${tableName}:`, error);
    return null;
  }
};
