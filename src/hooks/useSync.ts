
import { useState, useEffect, useCallback } from 'react';
import { DataTable, syncService } from '@/services/sync/SyncService';
import { dataSyncManager } from '@/services/sync/DataSyncManager';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { toast } from '@/components/ui/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

/**
 * Hook personnalisé pour gérer la synchronisation des données
 */
export function useSync(tableName: string) {
  const currentUser = getCurrentUser();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncFailed, setSyncFailed] = useState(false);
  const { isOnline } = useNetworkStatus();
  
  // Mettre à jour l'état initial
  useEffect(() => {
    const syncStatus = dataSyncManager.getSyncStatus(tableName);
    setLastSynced(syncStatus.lastSynced);
    setSyncFailed(syncStatus.status === 'failed');
  }, [tableName]);
  
  /**
   * Fonction pour synchroniser les données
   */
  const syncAndProcess = useCallback(async <T>(
    table: DataTable<T>, 
    options: { showToast?: boolean } | string = {}
  ) => {
    // Handle string parameter for backward compatibility
    const opts = typeof options === 'string' 
      ? { showToast: options !== 'auto' } 
      : options;
    
    if (isSyncing) {
      toast({
        title: "Synchronisation en cours",
        description: "Veuillez patienter, une synchronisation est déjà en cours"
      });
      return { success: false, message: "Une synchronisation est déjà en cours" };
    }
    
    try {
      setIsSyncing(true);
      setSyncFailed(false);
      
      // Synchroniser les données
      const result = await syncService.syncTable(table, currentUser);
      
      // Mettre à jour l'état
      setLastSynced(new Date());
      setSyncFailed(!result.success);
      
      if (result.success) {
        if (opts.showToast !== false) {
          toast({
            title: "Synchronisation réussie",
            description: `Les données ont été synchronisées (${table.tableName})`
          });
        }
      } else {
        if (opts.showToast !== false) {
          toast({
            variant: "destructive",
            title: "Échec de la synchronisation",
            description: result.message || "Une erreur est survenue lors de la synchronisation"
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      setSyncFailed(true);
      
      if (opts.showToast !== false) {
        toast({
          variant: "destructive",
          title: "Erreur de synchronisation",
          description: error instanceof Error ? error.message : "Erreur inconnue"
        });
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erreur inconnue"
      };
    } finally {
      setIsSyncing(false);
    }
  }, [tableName, isSyncing, currentUser]);
  
  /**
   * Charger les données depuis le serveur
   */
  const loadFromServer = useCallback(async <T>() => {
    try {
      setIsSyncing(true);
      
      // Charger les données
      const data = await syncService.loadDataFromServer<T>(tableName, currentUser);
      
      setLastSynced(new Date());
      setSyncFailed(false);
      
      return data;
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      setSyncFailed(true);
      
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: error instanceof Error ? error.message : "Erreur inconnue"
      });
      
      return [];
    } finally {
      setIsSyncing(false);
    }
  }, [tableName, currentUser]);
  
  /**
   * Réinitialise l'état de synchronisation
   */
  const resetSyncStatus = useCallback(() => {
    setSyncFailed(false);
  }, []);
  
  return {
    isSyncing,
    lastSynced,
    syncFailed,
    isOnline,
    syncAndProcess,
    loadFromServer,
    resetSyncStatus
  };
}
