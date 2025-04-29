
import { useState, useEffect, useCallback } from 'react';
import { dataSyncManager } from '@/services/sync/DataSyncManager';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export interface SyncRecord {
  status: 'idle' | 'syncing' | 'error' | 'success';
  lastSynced: Date | null;
  lastError: string | null;
  pendingChanges: boolean;
}

export interface SyncOptions {
  showToast?: boolean;
  force?: boolean;
}

export interface DataSyncState<T> extends SyncRecord {
  data: T[];
  syncData: (newData?: T[], options?: SyncOptions) => Promise<boolean>;
  loadData: (options?: SyncOptions) => Promise<T[]>;
  saveLocalData: (newData: T[]) => void;
  refreshStatus: () => void;
  isOnline: boolean;
}

/**
 * Hook pour la synchronisation des données avec le gestionnaire centralisé
 */
export function useDataSync<T>(tableName: string): DataSyncState<T> {
  const [syncRecord, setSyncRecord] = useState<SyncRecord>(() => ({
    status: 'idle',
    lastSynced: null,
    lastError: null,
    pendingChanges: false
  }));
  const [data, setData] = useState<T[]>([]);
  const { isOnline } = useNetworkStatus();
  
  // Rafraîchir le statut
  const refreshStatus = useCallback(() => {
    const status = dataSyncManager.getTableStatus(tableName);
    setSyncRecord({
      status: status.isSyncing ? 'syncing' : status.hasError ? 'error' : status.lastSynced ? 'success' : 'idle',
      lastSynced: status.lastSynced ? new Date(status.lastSynced) : null,
      lastError: status.errorMessage || null,
      pendingChanges: status.hasPendingChanges || false
    });
  }, [tableName]);
  
  // Charger les données initiales localement
  useEffect(() => {
    const localData = dataSyncManager.getLocalData<T>(tableName) || [];
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
    }
    
    const result = await dataSyncManager.syncTable(tableName, dataToSync, options);
    refreshStatus();
    
    return result.success;
  }, [tableName, data, isOnline, refreshStatus]);
  
  // Charger les données depuis le serveur
  const loadData = useCallback(async (options?: SyncOptions): Promise<T[]> => {
    const loadedData = await dataSyncManager.loadData<T>(tableName, options);
    setData(loadedData);
    refreshStatus();
    return loadedData;
  }, [tableName, refreshStatus]);
  
  // Sauvegarder les données localement
  const saveLocalData = useCallback((newData: T[]): void => {
    setData(newData);
    dataSyncManager.saveLocalData(tableName, newData);
    refreshStatus();
  }, [tableName, refreshStatus]);
  
  return {
    ...syncRecord,
    data,
    syncData,
    loadData,
    saveLocalData,
    refreshStatus,
    isOnline
  };
}
