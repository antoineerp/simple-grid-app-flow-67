import { useState, useCallback, useEffect } from 'react';
import { SyncResult } from '@/services/sync/SyncService';
import { useToast } from '@/components/ui/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSyncContext } from '@/features/sync/hooks/useSyncContext';
import { SyncState } from '@/features/sync/types/syncTypes';

/**
 * Hook pour gérer la synchronisation de données avec le serveur
 */
export const useSync = (tableName: string): SyncState & {
  syncAndProcess: <T>(data: T[], trigger?: "auto" | "manual" | "initial") => Promise<SyncResult>;
  resetSyncStatus: () => void;
  isOnline: boolean; // Add isOnline to the return type
} => {
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { isOnline } = useNetworkStatus();
  const { syncTable, syncStates } = useSyncContext();
  const { toast } = useToast();
  
  // Obtenir l'état de synchronisation à partir du contexte global
  const syncState = syncStates[tableName] || { 
    isSyncing: false, 
    lastSynced: null, 
    syncFailed: false,
    pendingSync: false,
    dataChanged: false
  };
  
  // Extraire les états
  const isSyncing = syncState.isSyncing;
  const syncFailed = syncState.syncFailed;
  const pendingSync = syncState.pendingSync;
  
  // Mise à jour de l'état de synchronisation local à partir du contexte global
  useEffect(() => {
    if (syncState.lastSynced && (!lastSynced || new Date(syncState.lastSynced) > lastSynced)) {
      setLastSynced(new Date(syncState.lastSynced));
    }
  }, [syncState, lastSynced]);
  
  // Fonction pour synchroniser les données et gérer les erreurs
  const syncAndProcess = useCallback(async <T>(
    data: T[],
    trigger: "auto" | "manual" | "initial" = "auto"
  ): Promise<SyncResult> => {
    // Utiliser le service central pour la synchronisation
    try {
      const result = await syncTable(tableName, data, trigger);
      
      if (result.success) {
        return {
          success: true,
          message: `${tableName} synchronisé avec succès`
        };
      } else {
        return {
          success: false,
          message: result.message
        };
      }
    } catch (error) {
      console.error(`useSync: Erreur lors de la synchronisation de ${tableName}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }, [tableName, syncTable]);
  
  // Réinitialiser l'état de synchronisation (compatibilité)
  const resetSyncStatus = useCallback(() => {
    // Cette fonction est conservée pour la compatibilité
    console.log(`useSync: resetSyncStatus appelé pour ${tableName} (no-op)`);
  }, [tableName]);
  
  return {
    isSyncing,
    lastSynced,
    syncFailed,
    pendingSync,
    dataChanged: syncState.dataChanged || false,
    syncAndProcess,
    resetSyncStatus,
    isOnline  // Include isOnline in the return object
  };
};
