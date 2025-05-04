
/**
 * Hook de contexte de synchronisation simplifié
 * Cette version fournit uniquement les interfaces nécessaires pour éviter les erreurs
 */

export const useSyncContext = () => {
  // Fonctions factices qui ne font strictement rien
  const registerSyncFunction = () => {
    console.log("SyncContext: Fonction d'enregistrement appelée (désactivée)");
    return true;
  };
  
  const unregisterSyncFunction = () => {
    console.log("SyncContext: Fonction de désenregistrement appelée (désactivée)");
    return true;
  };
  
  const syncAll = async (): Promise<boolean> => {
    console.log("SyncContext: Fonction syncAll appelée (désactivée)");
    return true;
  };
  
  const getSyncState = () => ({ 
    isSyncing: false, 
    lastSynced: new Date(), 
    error: null 
  });
  
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
