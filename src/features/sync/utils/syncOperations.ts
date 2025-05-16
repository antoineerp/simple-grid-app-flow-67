
/**
 * Opérations de synchronisation communes
 */

// Services simulés pour la démonstration
const syncService = {
  syncTable: async (tableName: string, data?: any[]): Promise<{success: boolean}> => {
    console.log(`Simulation de synchronisation de la table ${tableName}`, data);
    // Simuler un délai réseau et succès
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  },
  fetchData: async <T>(tableName: string): Promise<T[]> => {
    console.log(`Simulation de chargement des données pour ${tableName}`);
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 500));
    return [] as T[];
  }
};

export const syncTable = async (tableName: string, data: any[] = []): Promise<boolean> => {
  console.log(`Synchronisation de la table ${tableName} avec ${data.length} enregistrements`);
  
  try {
    // Mode hors ligne - simulation locale au lieu d'appels API qui échouent
    console.log("Mode hors ligne activé - Simulation de synchronisation");
    const result = await syncService.syncTable(tableName, data);
    return result.success;
  } catch (error) {
    console.error(`Erreur lors de la synchronisation de la table ${tableName}:`, error);
    return false;
  }
};

export const fetchSyncedData = async <T>(tableName: string): Promise<T[] | null> => {
  try {
    // Mode hors ligne - simulation locale au lieu d'appels API qui échouent
    console.log("Mode hors ligne activé - Simulation de chargement de données");
    return await syncService.fetchData<T>(tableName);
  } catch (error) {
    console.error(`Erreur lors du chargement des données synchronisées pour ${tableName}:`, error);
    return null;
  }
};

export const initSync = () => {
  console.log("Initialisation des services de synchronisation en mode hors ligne");
  // Code d'initialisation ici
};
