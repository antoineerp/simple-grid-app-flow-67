
// Hook de simulation de synchronisation entièrement désactivé

export const useSyncContext = () => {
  // Aucune initialisation réelle
  
  // Fonctions factices qui ne font strictement rien
  const registerSyncFunction = () => {};
  const unregisterSyncFunction = () => {};
  const syncAll = async (): Promise<boolean> => true;
  const getSyncState = () => ({ isSyncing: false, lastSynced: new Date(), error: null });
  const isInitialized = (): boolean => true;

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
