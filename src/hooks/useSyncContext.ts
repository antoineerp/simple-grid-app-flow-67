
/**
 * Interface simple de synchronisation sans dépendances externes
 */

interface SyncState {
  isSyncing: boolean;
  lastSynced: Date | null;
  error: string | null;
}

// État global pour la synchronisation
const globalSyncState = {
  isSyncing: false,
  lastSynced: null,
  error: null,
  syncFunctions: new Map<string, () => Promise<boolean>>()
};

export const useSyncContext = () => {
  // Enregistrer une fonction de synchronisation
  const registerSyncFunction = (key: string, syncFn: () => Promise<boolean>) => {
    globalSyncState.syncFunctions.set(key, syncFn);
    console.log(`Fonction de synchronisation enregistrée: ${key}`);
  };

  // Désenregistrer une fonction de synchronisation 
  const unregisterSyncFunction = (key: string) => {
    globalSyncState.syncFunctions.delete(key);
    console.log(`Fonction de synchronisation supprimée: ${key}`);
  };

  // Synchroniser tout
  const syncAll = async (): Promise<boolean> => {
    if (globalSyncState.isSyncing) {
      console.log("Synchronisation déjà en cours...");
      return false;
    }

    console.log("Début de la synchronisation globale...");
    globalSyncState.isSyncing = true;
    globalSyncState.error = null;

    try {
      const syncPromises = Array.from(globalSyncState.syncFunctions.entries()).map(
        async ([key, fn]) => {
          try {
            console.log(`Synchronisation de: ${key}`);
            return await fn();
          } catch (error) {
            console.error(`Erreur lors de la synchronisation de ${key}:`, error);
            return false;
          }
        }
      );

      const results = await Promise.all(syncPromises);
      const success = results.every(result => result === true);

      globalSyncState.lastSynced = new Date();
      console.log(`Synchronisation terminée avec ${success ? 'succès' : 'des erreurs'}`);
      
      return success;
    } catch (error) {
      console.error("Erreur lors de la synchronisation globale:", error);
      globalSyncState.error = error instanceof Error ? error.message : String(error);
      return false;
    } finally {
      globalSyncState.isSyncing = false;
    }
  };

  // Obtenir l'état actuel de la synchronisation
  const getSyncState = (): SyncState => {
    return {
      isSyncing: globalSyncState.isSyncing,
      lastSynced: globalSyncState.lastSynced,
      error: globalSyncState.error
    };
  };

  return {
    registerSyncFunction,
    unregisterSyncFunction,
    syncAll,
    getSyncState
  };
};

export type { SyncState };
