
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import { triggerSync } from '@/services/sync/triggerSync';

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
        triggerSync.notifyDataChange(tableName, exigences);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [dataChanged, exigences, tableName]);

  const syncWithServer = async () => {
    if (!isOnline) {
      return { success: false, message: "Vous êtes hors ligne" };
    }
    
    // Only sync if there are actual changes
    if (!dataChanged && !syncFailed) {
      console.log("No changes to sync for exigences");
      return { success: true, message: "Aucun changement à synchroniser" };
    }

    try {
      const syncResult = await syncTable(tableName, exigences);
      
      if (syncResult) {
        setDataChanged(false);
        return { success: true, message: "Synchronisation réussie" };
      } else {
        return { success: false, message: "Échec de la synchronisation" };
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  };

  const handleSync = async (): Promise<void> => {
    try {
      const result = await syncWithServer();
      if (loadError && result.success) {
        await handleResetLoadAttempts();
      }
      return Promise.resolve();
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
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
