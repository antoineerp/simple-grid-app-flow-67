
import { useState, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { isSynchronizing, executeSyncOperation } from '@/features/sync/utils/syncOperations';
import { formatDate } from '@/lib/utils';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { toast } from '@/components/ui/use-toast';

export const useSync = (tableName: string) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFailed, setSyncFailed] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { isOnline } = useNetworkStatus();

  // Fonction pour synchroniser les données avec le serveur
  const syncWithServer = useCallback(async <T>(
    data: T[], 
    trigger: "auto" | "manual" | "initial" = "manual"
  ) => {
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "Hors ligne",
        description: "Impossible de synchroniser les données en mode hors ligne."
      });
      return { success: false, message: "Offline" };
    }

    setIsSyncing(true);
    try {
      // Récupérer l'utilisateur actuel
      const userId = getCurrentUser();
      console.log(`useSync: Synchronisation de ${tableName} pour l'utilisateur ${userId}`);

      // Effectuer la synchronisation en utilisant l'opération du système central
      const syncFn = async (table: string, tableData: T[], operationId: string) => {
        try {
          // Implémentation simulée - remplacer par votre logique de synchronisation avec le serveur
          console.log(`useSync: Simulation de la synchronisation de ${table} (op: ${operationId})`);
          
          // Attendre un peu pour simuler un appel réseau
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // En production, cette fonction appellerait votre API
          // const response = await fetch(`${getApiUrl()}/sync/${table}?userId=${userId}`, {
          //   method: 'POST',
          //   headers: getAuthHeaders(),
          //   body: JSON.stringify(tableData)
          // });
          // return response.ok;
          
          return true; // Simulation de succès
        } catch (error) {
          console.error(`useSync: Erreur lors de la synchronisation de ${table}:`, error);
          return false;
        }
      };

      const result = await executeSyncOperation(tableName, data, syncFn, userId, trigger);
      
      if (result.success) {
        setLastSynced(new Date());
        setSyncFailed(false);
        console.log(`useSync: Synchronisation de ${tableName} réussie`);
      } else {
        setSyncFailed(true);
        console.error(`useSync: Échec de la synchronisation de ${tableName}: ${result.message}`);
      }
      
      return result;
    } catch (error) {
      console.error(`useSync: Erreur lors de la synchronisation de ${tableName}:`, error);
      setSyncFailed(true);
      
      return { 
        success: false, 
        message: error instanceof Error ? error.message : "Unknown error" 
      };
    } finally {
      setIsSyncing(false);
    }
  }, [tableName, isOnline]);

  // Fonction pour réaliser le processus complet de synchronisation et traitement
  const syncAndProcess = useCallback(async <T>(
    data: T[],
    trigger: "auto" | "manual" | "initial" = "manual"
  ) => {
    return await syncWithServer(data, trigger);
  }, [syncWithServer]);

  return {
    isSyncing: isSyncing || isSynchronizing(tableName),
    syncFailed,
    lastSynced,
    lastSyncedFormatted: lastSynced ? formatDate(lastSynced) : 'Jamais',
    syncWithServer,
    syncAndProcess,
  };
};
