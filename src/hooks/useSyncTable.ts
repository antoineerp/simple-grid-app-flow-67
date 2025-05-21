
import { useState, useEffect, useCallback } from 'react';
import { syncTable, getLocalData, saveLocalData } from '@/services/sync/syncService';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface SyncTableOptions {
  tableName: string;
  autoSync?: boolean;
  syncInterval?: number; // in milliseconds
  onSyncSuccess?: (data: any[]) => void;
  onSyncFailure?: (error: any) => void;
}

/**
 * Hook pour gérer la synchronisation d'une table avec le serveur
 */
export function useSyncTable<T>(options: SyncTableOptions) {
  const { tableName, autoSync = true, syncInterval = 60000 } = options;
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  const [data, setData] = useState<T[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncFailed, setSyncFailed] = useState(false);
  const userId = getCurrentUser();

  // Charger les données locales au démarrage
  useEffect(() => {
    const localData = getLocalData<T>(tableName, userId);
    setData(localData);
    
    // Vérifier la date de dernière synchronisation
    const key = `last_synced_${tableName}`;
    const storedDate = localStorage.getItem(key);
    if (storedDate) {
      setLastSynced(new Date(storedDate));
    }
    
    // Vérifier si la dernière synchronisation a échoué
    const failedKey = `sync_failed_${tableName}`;
    const failedData = localStorage.getItem(failedKey);
    setSyncFailed(!!failedData);
  }, [tableName, userId]);

  // Sauvegarder les données localement lorsqu'elles changent
  useEffect(() => {
    if (data.length > 0) {
      saveLocalData(tableName, data, userId);
    }
  }, [data, tableName, userId]);

  // Synchroniser avec le serveur
  const syncWithServer = useCallback(async (triggerType: "auto" | "manual" | "initial" = "manual"): Promise<boolean> => {
    if (!isOnline) {
      console.log(`SyncTable: Mode hors ligne, sauvegarde locale uniquement pour ${tableName}`);
      return false;
    }
    
    setIsSyncing(true);
    setSyncFailed(false);
    
    try {
      console.log(`SyncTable: Synchronisation ${triggerType} de ${tableName}`);
      
      const result = await syncTable(tableName, data, userId, triggerType);
      
      if (result.success) {
        setLastSynced(new Date());
        localStorage.removeItem(`sync_failed_${tableName}`);
        
        if (triggerType === "manual") {
          toast({
            title: "Synchronisation réussie",
            description: `Les données ${tableName} ont été synchronisées avec le serveur.`
          });
        }
        
        if (options.onSyncSuccess) {
          options.onSyncSuccess(data);
        }
        
        return true;
      } else {
        setSyncFailed(true);
        
        if (triggerType === "manual") {
          toast({
            variant: "destructive",
            title: "Erreur de synchronisation",
            description: result.message || "Impossible de synchroniser les données."
          });
        }
        
        if (options.onSyncFailure) {
          options.onSyncFailure(result.message);
        }
        
        return false;
      }
    } catch (error) {
      console.error(`SyncTable: Erreur lors de la synchronisation de ${tableName}:`, error);
      setSyncFailed(true);
      
      if (triggerType === "manual") {
        toast({
          variant: "destructive",
          title: "Erreur de synchronisation",
          description: error instanceof Error ? error.message : "Erreur inconnue"
        });
      }
      
      if (options.onSyncFailure) {
        options.onSyncFailure(error);
      }
      
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [data, isOnline, options, tableName, toast, userId]);

  // Synchronisation automatique
  useEffect(() => {
    if (!autoSync || !isOnline) return;
    
    const intervalId = setInterval(() => {
      syncWithServer("auto").catch((error) => {
        console.error(`SyncTable: Erreur lors de la synchronisation automatique de ${tableName}:`, error);
      });
    }, syncInterval);
    
    // Nettoyer l'intervalle lors du démontage
    return () => {
      clearInterval(intervalId);
    };
  }, [autoSync, isOnline, syncInterval, syncWithServer, tableName]);

  // Fonction pour mettre à jour les données
  const updateData = useCallback((newData: T[]) => {
    setData(newData);
    saveLocalData(tableName, newData, userId);
    
    // Synchroniser immédiatement si en ligne
    if (isOnline && autoSync) {
      syncWithServer("auto").catch((error) => {
        console.error(`SyncTable: Erreur lors de la synchronisation après mise à jour de ${tableName}:`, error);
      });
    }
  }, [autoSync, isOnline, syncWithServer, tableName, userId]);

  return {
    data,
    setData: updateData,
    isSyncing,
    lastSynced,
    syncFailed,
    syncWithServer,
    isOnline
  };
}
