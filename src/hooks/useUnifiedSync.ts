
/**
 * Hook unifié pour la synchronisation des données
 */
import { useState, useEffect, useCallback } from 'react';
import { unifiedSync } from '@/services/sync/UnifiedSyncService';

interface SyncStatus {
  isLoading: boolean;
  isSyncing: boolean;
  isOnline: boolean;
  lastSynced: Date | null;
  hasPendingChanges: boolean;
}

export function useUnifiedSync<T extends object>(tableName: string, userId?: string) {
  const [data, setData] = useState<T[]>([]);
  const [status, setStatus] = useState<SyncStatus>({
    isLoading: false,
    isSyncing: false,
    isOnline: true,
    lastSynced: null,
    hasPendingChanges: false
  });
  
  // Charger les données initiales
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      try {
        setStatus(prev => ({ ...prev, isLoading: true }));
        const loadedData = await unifiedSync.loadData<T>(tableName, userId);
        
        if (isMounted) {
          setData(loadedData);
          setStatus(prev => ({ 
            ...prev, 
            isLoading: false,
            lastSynced: unifiedSync.getLastSynced(tableName),
            hasPendingChanges: unifiedSync.hasPendingChanges(tableName)
          }));
        }
      } catch (error) {
        console.error(`[useUnifiedSync] Erreur lors du chargement initial:`, error);
        
        if (isMounted) {
          setStatus(prev => ({ 
            ...prev, 
            isLoading: false,
            hasPendingChanges: unifiedSync.hasPendingChanges(tableName)
          }));
        }
      }
    };
    
    loadInitialData();
    
    return () => {
      isMounted = false;
    };
  }, [tableName, userId]);
  
  // Synchroniser les données
  const syncData = useCallback(async (newData?: T[]) => {
    try {
      setStatus(prev => ({ ...prev, isSyncing: true }));
      
      // Utiliser soit les nouvelles données, soit les données actuelles
      const dataToSync = newData || data;
      
      // Si de nouvelles données sont fournies, mettre à jour l'état immédiatement
      if (newData) {
        setData(newData);
      }
      
      // Synchroniser avec le serveur
      const result = await unifiedSync.syncData(tableName, dataToSync, userId, {
        showToast: true
      });
      
      setStatus(prev => ({ 
        ...prev, 
        isSyncing: false,
        lastSynced: result.success ? new Date() : prev.lastSynced,
        hasPendingChanges: !result.success || unifiedSync.hasPendingChanges(tableName)
      }));
      
      return result;
    } catch (error) {
      console.error(`[useUnifiedSync] Erreur lors de la synchronisation:`, error);
      
      setStatus(prev => ({ 
        ...prev, 
        isSyncing: false,
        hasPendingChanges: true
      }));
      
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }, [data, tableName, userId]);
  
  // Recharger les données depuis le serveur
  const refreshData = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, isLoading: true }));
      
      const refreshedData = await unifiedSync.loadData<T>(tableName, userId, {
        showToast: true
      });
      
      setData(refreshedData);
      setStatus(prev => ({ 
        ...prev, 
        isLoading: false,
        lastSynced: unifiedSync.getLastSynced(tableName),
        hasPendingChanges: unifiedSync.hasPendingChanges(tableName)
      }));
      
      return refreshedData;
    } catch (error) {
      console.error(`[useUnifiedSync] Erreur lors du rafraîchissement:`, error);
      
      setStatus(prev => ({ 
        ...prev, 
        isLoading: false
      }));
      
      return data;
    }
  }, [tableName, userId, data]);
  
  // Forcer la synchronisation depuis le serveur
  const forceSyncFromServer = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, isLoading: true, isSyncing: true }));
      
      const result = await unifiedSync.forceSyncFromServer<T>(tableName, userId);
      if (result.success) {
        const refreshedData = await unifiedSync.loadData<T>(tableName, userId);
        setData(refreshedData);
      }
      
      setStatus(prev => ({ 
        ...prev, 
        isLoading: false,
        isSyncing: false,
        lastSynced: result.success ? result.timestamp || new Date() : prev.lastSynced,
        hasPendingChanges: !result.success
      }));
      
      return result;
    } catch (error) {
      console.error(`[useUnifiedSync] Erreur lors de la synchronisation forcée:`, error);
      
      setStatus(prev => ({ 
        ...prev, 
        isLoading: false,
        isSyncing: false
      }));
      
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }, [tableName, userId]);
  
  // Sauvegarder des données
  const saveData = useCallback((newData: T[]) => {
    unifiedSync.syncData(tableName, newData, userId, { showToast: false });
    setData(newData);
  }, [tableName, userId]);
  
  return {
    data,
    setData,
    syncData,
    refreshData,
    forceSyncFromServer,
    saveData,
    ...status
  };
}
