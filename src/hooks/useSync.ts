
import { useState, useCallback, useEffect } from 'react';
import { syncService, DataTable, SyncResult } from '@/services/sync/SyncService';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export interface SyncState {
  isSyncing: boolean;
  lastSynced: Date | null;
  syncFailed: boolean;
  syncAndProcess: <T>(table: DataTable<T>) => Promise<SyncResult>;
  resetSyncStatus: () => void;
  isOnline: boolean;
}

/**
 * Hook pour gérer la synchronisation de données avec le serveur
 */
export const useSync = (tableName: string): SyncState => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(syncService.getLastSynced(tableName));
  const [syncFailed, setSyncFailed] = useState<boolean>(false);
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  
  // Mise à jour de l'état de synchronisation
  useEffect(() => {
    const syncingState = syncService.isSyncingTable(tableName);
    setIsSyncing(syncingState);
    
    // Mettre à jour la dernière date de synchronisation
    const lastSyncDate = syncService.getLastSynced(tableName);
    if (lastSyncDate && (!lastSynced || lastSyncDate > lastSynced)) {
      setLastSynced(lastSyncDate);
    }
  }, [tableName, lastSynced]);
  
  // Fonction pour synchroniser les données et gérer les erreurs
  const syncAndProcess = useCallback(async <T>(table: DataTable<T>): Promise<SyncResult> => {
    if (!isOnline) {
      toast({
        title: "Mode hors ligne",
        description: "La synchronisation n'est pas disponible en mode hors ligne",
        variant: "destructive"
      });
      throw new Error("Mode hors ligne");
    }
    
    if (isSyncing) {
      toast({
        title: "Synchronisation en cours",
        description: "Veuillez attendre la fin de la synchronisation en cours",
      });
      throw new Error("Synchronisation déjà en cours");
    }
    
    setIsSyncing(true);
    
    try {
      const result = await syncService.syncTable(table);
      
      if (result.success) {
        setLastSynced(new Date());
        setSyncFailed(false);
        toast({
          title: "Synchronisation réussie",
          description: result.message || `${tableName} synchronisé avec succès`,
        });
      } else {
        setSyncFailed(true);
        toast({
          title: "Échec de la synchronisation",
          description: result.message || "Une erreur est survenue lors de la synchronisation",
          variant: "destructive"
        });
      }
      
      return result;
    } catch (error) {
      setSyncFailed(true);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      toast({
        title: "Erreur de synchronisation",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, tableName, toast]);
  
  // Réinitialiser l'état de synchronisation
  const resetSyncStatus = useCallback(() => {
    setSyncFailed(false);
  }, []);
  
  return {
    isSyncing,
    lastSynced,
    syncFailed,
    syncAndProcess,
    resetSyncStatus,
    isOnline
  };
};
