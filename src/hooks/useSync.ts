
import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { useSyncContext } from './useSyncContext';

interface SyncOptions {
  autoSync?: boolean;
  initialFetch?: boolean;
}

interface SyncResult {
  success: boolean;
  message?: string;
}

export function useSync<T>(tableName: string, options: SyncOptions = {}) {
  const { autoSync = true, initialFetch = true } = options;
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(initialFetch);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useNetworkStatus();
  const { syncStates, startSync, forceSync } = useSyncContext();
  
  const tableState = syncStates[tableName] || {
    isSyncing: false,
    syncFailed: false,
    lastSynced: null,
    errorMessage: null,
    hasPendingChanges: false
  };
  
  const syncData = useCallback(async (): Promise<SyncResult> => {
    if (!isOnline) {
      return { success: false, message: 'Pas de connexion Internet' };
    }
    
    try {
      const result = await startSync(tableName);
      return { success: result, message: result ? 'Synchronisation réussie' : 'Échec de la synchronisation' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      return { success: false, message: errorMessage };
    }
  }, [isOnline, startSync, tableName]);
  
  const forceSyncData = useCallback(async (): Promise<SyncResult> => {
    if (!isOnline) {
      return { success: false, message: 'Pas de connexion Internet' };
    }
    
    try {
      const result = await forceSync(tableName);
      return { success: result, message: result ? 'Synchronisation forcée réussie' : 'Échec de la synchronisation forcée' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      return { success: false, message: errorMessage };
    }
  }, [isOnline, forceSync, tableName]);
  
  useEffect(() => {
    // Initial fetch logic would go here
    setIsLoading(false);
  }, [initialFetch, tableName]);
  
  useEffect(() => {
    if (tableState.syncFailed && tableState.errorMessage) {
      setError(tableState.errorMessage);
    } else {
      setError(null);
    }
  }, [tableState.syncFailed, tableState.errorMessage]);
  
  // Auto sync logic
  useEffect(() => {
    if (!autoSync || !isOnline) return;
    
    // Auto sync logic would go here
  }, [autoSync, isOnline, tableName]);
  
  return {
    data,
    setData,
    isLoading,
    isSyncing: tableState.isSyncing,
    syncFailed: tableState.syncFailed,
    lastSynced: tableState.lastSynced ? new Date(tableState.lastSynced) : null,
    error,
    syncData,
    forceSyncData,
    isOnline
  };
}
