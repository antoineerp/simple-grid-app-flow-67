
/**
 * Interface pour le service de synchronisation
 */
export interface SyncService {
  syncTable: (tableName: string) => Promise<{ success: boolean; message?: string }>;
  fetchData: <T>(tableName: string) => Promise<T[] | null>;
  isSyncing: (tableName: string) => boolean;
  markAsSynced: (tableName: string) => void;
  registerSyncListener: (tableName: string, callback: () => void) => void;
  unregisterSyncListener: (tableName: string, callback: () => void) => void;
}

/**
 * Instance du service de synchronisation
 */
export const syncService: SyncService = {
  syncTable: async (tableName: string) => {
    // Implémentation simplifiée
    console.log(`Synchronisation de la table: ${tableName}`);
    return { success: true };
  },
  
  fetchData: async <T>(tableName: string) => {
    // Implémentation simplifiée
    console.log(`Récupération des données de la table: ${tableName}`);
    return [] as T[];
  },
  
  isSyncing: (tableName: string) => {
    return false;
  },
  
  markAsSynced: (tableName: string) => {
    console.log(`Table marquée comme synchronisée: ${tableName}`);
  },
  
  registerSyncListener: (tableName: string, callback: () => void) => {
    console.log(`Enregistrement d'un écouteur pour: ${tableName}`);
  },
  
  unregisterSyncListener: (tableName: string, callback: () => void) => {
    console.log(`Désenregistrement d'un écouteur pour: ${tableName}`);
  }
};
