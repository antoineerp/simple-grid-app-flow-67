
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import { triggerSync } from '@/services/sync/triggerSync';
import { getCurrentUserId } from '@/utils/userUtils';

export const useExigenceSync = (
  tableName: string, 
  exigences: any[], 
  dataChanged: boolean,
  setDataChanged: (value: boolean) => void,
  loadError: string | null,
  handleResetLoadAttempts: () => Promise<void>
) => {
  const { toast } = useToast();
  const { syncTable, syncStates, isOnline } = useGlobalSync();
  const currentUser = getCurrentUserId();
  
  // Get synchronization state for exigences from the global sync context
  const syncState = syncStates[tableName] || { 
    isSyncing: false, 
    lastSynced: null, 
    syncFailed: false 
  };
  
  const isSyncing = syncState.isSyncing;
  const lastSynced = syncState.lastSynced;
  const syncFailed = syncState.syncFailed;

  // Listen for window beforeunload event to sync data if needed
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (dataChanged) {
        // Store the data that needs to be synced
        console.log(`[useExigenceSync] Enregistrement des données avant déchargement pour ${currentUser}`);
        triggerSync.notifyDataChange(tableName, exigences);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [dataChanged, exigences, tableName, currentUser]);

  const syncWithServer = async () => {
    console.log(`[useExigenceSync] Tentative de synchronisation pour l'utilisateur ${currentUser}`);
    
    if (!isOnline) {
      console.log("[useExigenceSync] Synchronisation impossible - hors ligne");
      return { success: false, message: "Vous êtes hors ligne" };
    }
    
    // Only sync if there are actual changes
    if (!dataChanged && !syncFailed && !loadError) {
      console.log("[useExigenceSync] Aucun changement à synchroniser pour exigences");
      return { success: true, message: "Aucun changement à synchroniser" };
    }

    try {
      console.log(`[useExigenceSync] Synchronisation de ${exigences.length} exigences`);
      const syncResult = await syncTable(tableName, exigences);
      
      if (syncResult) {
        console.log("[useExigenceSync] Synchronisation réussie");
        setDataChanged(false);
        return { success: true, message: "Synchronisation réussie" };
      } else {
        console.log("[useExigenceSync] Échec de la synchronisation");
        return { success: false, message: "Échec de la synchronisation" };
      }
    } catch (error) {
      console.error('[useExigenceSync] Erreur lors de la synchronisation:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  };

  const handleSync = async (): Promise<void> => {
    try {
      console.log("[useExigenceSync] Démarrage de la synchronisation manuelle");
      const result = await syncWithServer();
      if (loadError && result.success) {
        console.log("[useExigenceSync] Réinitialisation des tentatives de chargement après succès");
        await handleResetLoadAttempts();
      }
      return Promise.resolve();
    } catch (error) {
      console.error("[useExigenceSync] Erreur lors de la synchronisation:", error);
      return Promise.reject(error);
    }
  };

  return {
    isSyncing,
    isOnline,
    lastSynced,
    syncFailed,
    syncWithServer,
    handleSync
  };
};
