
import { useCallback } from 'react';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import { useToast } from '@/hooks/use-toast';

interface SyncHookOptions {
  showToasts?: boolean;
}

export function useSyncContext<T>(tableName: string, data: T[], options: SyncHookOptions = {}) {
  const { syncStates, syncTable, isOnline } = useGlobalSync();
  const { toast } = useToast();
  const { showToasts = true } = options;

  // Obtenir l'état de synchronisation pour cette table
  const syncState = syncStates[tableName] || {
    isSyncing: false,
    lastSynced: null,
    syncFailed: false
  };

  // Méthode de synchronisation adaptée pour cette table spécifique
  const syncWithServer = useCallback(async () => {
    if (!isOnline) {
      if (showToasts) {
        toast({
          title: "Mode hors ligne",
          description: "La synchronisation n'est pas disponible en mode hors ligne"
        });
      }
      return false;
    }

    try {
      return await syncTable(tableName, data);
    } catch (error) {
      console.error(`Erreur lors de la synchronisation de ${tableName}:`, error);
      return false;
    }
  }, [isOnline, syncTable, tableName, data, showToasts, toast]);

  return {
    isSyncing: syncState.isSyncing,
    lastSynced: syncState.lastSynced,
    syncFailed: syncState.syncFailed,
    isOnline,
    syncWithServer
  };
}
