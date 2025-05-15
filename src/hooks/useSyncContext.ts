
/**
 * Interface de synchronisation complète
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
  syncFunctions: new Map<string, () => Promise<boolean>>(),
  initialized: false,
  isSyncEnabled: true // Ajout de l'option pour activer/désactiver la synchronisation
};

export const useSyncContext = () => {
  // Initialiser le contexte si ce n'est pas déjà fait
  if (!globalSyncState.initialized) {
    console.log("SyncContext: Initialisation");
    globalSyncState.initialized = true;
  }

  // Enregistrer une fonction de synchronisation
  const registerSyncFunction = (key: string, syncFn: () => Promise<boolean>) => {
    globalSyncState.syncFunctions.set(key, syncFn);
    console.log(`SyncContext: Fonction de synchronisation enregistrée: ${key}`);
  };

  // Désenregistrer une fonction de synchronisation 
  const unregisterSyncFunction = (key: string) => {
    globalSyncState.syncFunctions.delete(key);
    console.log(`SyncContext: Fonction de synchronisation supprimée: ${key}`);
  };

  // Synchroniser tout
  const syncAll = async (): Promise<boolean> => {
    if (globalSyncState.isSyncing) {
      console.log("SyncContext: Synchronisation déjà en cours...");
      return false;
    }

    console.log("SyncContext: Début de la synchronisation globale...");
    globalSyncState.isSyncing = true;
    globalSyncState.error = null;

    try {
      const syncPromises = Array.from(globalSyncState.syncFunctions.entries()).map(
        async ([key, fn]) => {
          try {
            console.log(`SyncContext: Synchronisation de: ${key}`);
            return await fn();
          } catch (error) {
            console.error(`SyncContext: Erreur lors de la synchronisation de ${key}:`, error);
            return false;
          }
        }
      );

      const results = await Promise.all(syncPromises);
      const success = results.every(result => result === true);

      globalSyncState.lastSynced = new Date();
      console.log(`SyncContext: Synchronisation terminée avec ${success ? 'succès' : 'des erreurs'}`);
      
      return success;
    } catch (error) {
      console.error("SyncContext: Erreur lors de la synchronisation globale:", error);
      globalSyncState.error = error instanceof Error ? error.message : String(error);
      return false;
    } finally {
      globalSyncState.isSyncing = false;
    }
  };

  // Force le traitement de la file d'attente des opérations de synchronisation
  const forceProcessQueue = async (): Promise<void> => {
    console.log("SyncContext: Traitement forcé de la file d'attente de synchronisation");
    // Dans cette implémentation simple, nous ne faisons rien de particulier
    // Cette fonction pourrait être implémentée pour traiter une file d'attente d'opérations
  };

  // Obtenir l'état actuel de la synchronisation
  const getSyncState = (): SyncState => {
    return {
      isSyncing: globalSyncState.isSyncing,
      lastSynced: globalSyncState.lastSynced,
      error: globalSyncState.error
    };
  };

  // Vérifier si le contexte est initialisé
  const isInitialized = (): boolean => {
    return globalSyncState.initialized;
  };

  // Vérifier si la synchronisation est activée
  const isSyncEnabled = (): boolean => {
    return globalSyncState.isSyncEnabled;
  };

  // État de la connexion (en ligne / hors ligne)
  const isOnline = true; // Simplification - dans un cas réel, utilisez navigator.onLine ou une détection plus robuste

  return {
    registerSyncFunction,
    unregisterSyncFunction,
    syncAll,
    getSyncState,
    isInitialized,
    isSyncEnabled,
    forceProcessQueue,
    isOnline
  };
};

export type { SyncState };
