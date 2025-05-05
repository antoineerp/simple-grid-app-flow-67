
import { useState, useEffect, useCallback } from 'react';
import { dataSyncManager, SyncStatus, SyncRecord, SyncOptions } from '@/services/sync/DataSyncManager';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { SyncResult } from '@/services/sync/SyncService';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

export interface DataSyncState<T> {
  data: T[];
  syncData: (newData?: T[], options?: SyncOptions) => Promise<boolean>;
  loadData: (options?: SyncOptions) => Promise<T[]>;
  saveLocalData: (newData: T[]) => void;
  refreshStatus: () => void;
  isOnline: boolean;
  syncStatus: SyncStatus;
  lastSynced: Date | null;
  lastError: string | null;
  pendingChanges: boolean;
}

/**
 * Hook pour la synchronisation des données avec le gestionnaire centralisé
 */
export function useDataSync<T>(tableName: string): DataSyncState<T> {
  const [syncRecord, setSyncRecord] = useState(() => 
    dataSyncManager.getSyncStatus(tableName)
  );
  const [data, setData] = useState<T[]>([]);
  const { isOnline } = useNetworkStatus();
  
  // Rafraîchir le statut
  const refreshStatus = useCallback(() => {
    setSyncRecord({ ...dataSyncManager.getSyncStatus(tableName) });
  }, [tableName]);
  
  // Charger les données initiales localement
  useEffect(() => {
    const localData = dataSyncManager.getLocalData<T>(tableName);
    setData(localData);
    
    // Configurer un intervalle pour surveiller les changements de statut
    const intervalId = setInterval(refreshStatus, 2000);
    
    return () => clearInterval(intervalId);
  }, [tableName, refreshStatus]);
  
  // Synchroniser les données avec le serveur
  const syncData = useCallback(async (
    newData?: T[],
    options?: SyncOptions
  ): Promise<boolean> => {
    if (!isOnline) {
      return false;
    }
    
    const dataToSync = newData || data;
    
    // Si des données sont fournies, les enregistrer localement d'abord
    if (newData) {
      setData(newData);
      dataSyncManager.saveLocalData(tableName, newData);
      dataSyncManager.markTableAsChanged(tableName);
    }
    
    try {
      const result = await dataSyncManager.syncData(tableName, dataToSync, options);
      refreshStatus();
      return result.success;
    } catch (error) {
      console.error(`Error syncing data for ${tableName}:`, error);
      return false;
    }
  }, [tableName, data, isOnline, refreshStatus]);
  
  // Charger les données depuis le serveur
  const loadData = useCallback(async (options?: SyncOptions): Promise<T[]> => {
    try {
      const result = await dataSyncManager.loadData<T>(tableName, options);
      setData(result);
      refreshStatus();
      return result;
    } catch (error) {
      console.error(`Error loading data for ${tableName}:`, error);
      // Try to load from local storage as fallback
      const localData = dataSyncManager.getLocalData<T>(tableName);
      setData(localData);
      return localData;
    }
  }, [tableName, refreshStatus]);
  
  // Sauvegarder les données localement
  const saveLocalData = useCallback((newData: T[]): void => {
    setData(newData);
    dataSyncManager.saveLocalData(tableName, newData);
    refreshStatus();
  }, [tableName, refreshStatus]);
  
  return {
    data,
    syncData,
    loadData,
    saveLocalData,
    refreshStatus,
    isOnline,
    syncStatus: syncRecord.status,
    lastSynced: syncRecord.lastSynced,
    lastError: syncRecord.lastError,
    pendingChanges: syncRecord.pendingChanges > 0
  };
}
