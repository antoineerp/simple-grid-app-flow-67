import { useState, useEffect, useCallback } from 'react';
import { dataSyncManager, SyncStatusEnum, SyncStatus } from '@/services/sync/DataSyncManager';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// Use existing SyncRecord from DataSyncManager
import { SyncRecord, SyncOptions } from '@/services/sync/DataSyncManager';

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
  const [syncRecord, setSyncRecord] = useState<SyncRecord>({
    status: SyncStatusEnum.IDLE as unknown as SyncStatus,
    lastSynced: null,
    lastError: null,
    pendingChanges: false
  });
  const [data, setData] = useState<T[]>([]);
  const { isOnline } = useNetworkStatus();
  
  // Rafraîchir le statut
  const refreshStatus = useCallback(() => {
    const state = dataSyncManager.getTableStatus(tableName);
    setSyncRecord({
      status: state.isSyncing ? (SyncStatusEnum.SYNCING as unknown as SyncStatus) : 
              state.hasError ? (SyncStatusEnum.ERROR as unknown as SyncStatus) : 
              state.lastSynced ? (SyncStatusEnum.SUCCESS as unknown as SyncStatus) : 
              (SyncStatusEnum.IDLE as unknown as SyncStatus),
      lastSynced: state.lastSynced ? new Date(state.lastSynced) : null,
      lastError: state.errorMessage || null,
      pendingChanges: state.hasPendingChanges || false
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
    
    try {
      console.log(`[useDataSync] Synchronisation des données pour ${tableName} (${dataToSync.length} éléments)`);
      const result = await dataSyncManager.syncTable(tableName, dataToSync, options);
      refreshStatus();
      return result.success;
    } catch (error) {
      console.error(`[useDataSync] Erreur lors de la synchronisation pour ${tableName}:`, error);
      refreshStatus();
      return false;
    }
  }, [tableName, data, isOnline, refreshStatus]);
  
  // Charger les données depuis le serveur
  const loadData = useCallback(async (options?: SyncOptions): Promise<T[]> => {
    try {
      console.log(`[useDataSync] Chargement des données pour ${tableName}`);
      const loadedData = await dataSyncManager.loadData<T>(tableName, options);
      setData(loadedData);
      refreshStatus();
      return loadedData;
    } catch (error) {
      console.error(`[useDataSync] Erreur lors du chargement des données pour ${tableName}:`, error);
      refreshStatus();
      
      // En cas d'erreur, retourner les données actuelles
      return data;
    }
  }, [tableName, refreshStatus, data]);
  
  // Sauvegarder les données localement
  const saveLocalData = useCallback((newData: T[]): void => {
    console.log(`[useDataSync] Sauvegarde locale des données pour ${tableName} (${newData.length} éléments)`);
    setData(newData);
    dataSyncManager.saveLocalData(tableName, newData);
    refreshStatus();
    
    // Tenter une synchronisation automatique si en ligne
    if (isOnline) {
      syncData(newData, { showToast: false }).catch(err => {
        console.warn(`[useDataSync] Échec de la synchronisation automatique pour ${tableName}:`, err);
      });
    }
  }, [tableName, refreshStatus, syncData, isOnline]);
  
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
