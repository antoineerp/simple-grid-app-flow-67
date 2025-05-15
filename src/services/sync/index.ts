
// Services de synchronisation centralisés

// Import et réexportation des services
import { default as SyncService } from './SyncService';
import { triggerSync } from './triggerSync';

// Export des types comme type pour éviter les erreurs isolatedModules
export type { DataTable, SyncResult } from './syncServiceImpl';

// Export des services
export { SyncService, triggerSync };

// Export d'un service par défaut pour la compatibilité
export const syncService = {
  syncTable: async (tableName: string, data?: any[]) => {
    console.log("Service de synchronisation appelé pour", tableName);
    return { success: true };
  },
  
  fetchData: async <T>(tableName: string): Promise<T[]> => {
    console.log("Chargement des données pour", tableName);
    return [] as T[];
  }
};

// Export du DatabaseHelper par défaut
export * from './DatabaseHelper';
