
import { useState, useCallback, useEffect } from 'react';
import { useSyncContext } from '@/contexts/SyncContext';
import { toast } from '@/components/ui/use-toast';

export function useSync(tableName: string) {
  const syncContext = useSyncContext();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  
  useEffect(() => {
    // Initialiser avec les données du contexte
    if (syncContext.isInitialized()) {
      setLastSynced(syncContext.getLastSynced(tableName));
      const error = syncContext.getSyncError(tableName);
      setSyncFailed(!!error);
    }
  }, [syncContext, tableName]);

  const syncAndProcess = useCallback(async <T extends {}>(
    data: T[],
    trigger: "auto" | "manual" | "initial" = "manual"
  ) => {
    setIsSyncing(true);
    setSyncFailed(false);
    
    try {
      // Synchroniser les données
      const success = await syncContext.syncData<T>(tableName, data);
      
      if (success) {
        const newLastSynced = syncContext.getLastSynced(tableName);
        setLastSynced(newLastSynced);
        
        if (trigger === "manual") {
          toast({
            title: "Synchronisation réussie",
            description: `Données ${tableName} synchronisées avec succès.`
          });
        }
        
        return { success: true, timestamp: newLastSynced };
      } else {
        setSyncFailed(true);
        
        if (trigger === "manual") {
          toast({
            title: "Échec de la synchronisation",
            description: syncContext.getSyncError(tableName) || "Une erreur s'est produite",
            variant: "destructive"
          });
        }
        
        return { success: false, error: syncContext.getSyncError(tableName) };
      }
    } catch (error) {
      setSyncFailed(true);
      
      if (trigger === "manual") {
        toast({
          title: "Erreur de synchronisation",
          description: error instanceof Error ? error.message : "Une erreur s'est produite",
          variant: "destructive"
        });
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Une erreur s'est produite"
      };
    } finally {
      setIsSyncing(false);
    }
  }, [syncContext, tableName]);

  const loadData = useCallback(async <T extends {}>(): Promise<T[]> => {
    setIsSyncing(true);
    setSyncFailed(false);
    
    try {
      const result = await syncContext.loadData<T>(tableName);
      const newLastSynced = syncContext.getLastSynced(tableName);
      setLastSynced(newLastSynced);
      return result;
    } catch (error) {
      setSyncFailed(true);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [syncContext, tableName]);

  return {
    syncAndProcess,
    loadData,
    isSyncing,
    isOnline: syncContext.isOnline,
    lastSynced,
    syncFailed,
    syncError: syncContext.getSyncError(tableName)
  };
}
