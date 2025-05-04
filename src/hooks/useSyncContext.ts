
// Hook de simulation de synchronisation (ne fait rien de réel)

export const useSyncContext = () => {
  // Initialiser le contexte si ce n'est pas déjà fait
  console.log("SyncContext: Désactivé, fonctionnalité simulée");

  // Fonctions factices qui ne font rien de réel
  const registerSyncFunction = (key: string, syncFn: () => Promise<boolean>) => {
    console.log(`SyncContext: Fonctionnalité désactivée - ${key}`);
    return;
  };

  const unregisterSyncFunction = (key: string) => {
    return;
  };

  const syncAll = async (): Promise<boolean> => {
    console.log("SyncContext: Synchronisation désactivée");
    return true;
  };

  const getSyncState = () => {
    return {
      isSyncing: false,
      lastSynced: new Date(),
      error: null
    };
  };

  const isInitialized = (): boolean => {
    return true;
  };

  return {
    registerSyncFunction,
    unregisterSyncFunction,
    syncAll,
    getSyncState,
    isInitialized
  };
};

export interface SyncState {
  isSyncing: boolean;
  lastSynced: Date | null;
  error: string | null;
}
