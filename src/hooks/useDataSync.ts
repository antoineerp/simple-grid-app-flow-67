
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { dataSyncManager, SyncStatus, SyncOptions } from '@/services/sync/DataSyncManager';
import { useNetworkStatus } from './useNetworkStatus';

export interface DataSyncState<T> {
  data: T;
  isSyncing: boolean;
  isLoading: boolean;
  error: string | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  lastSynced: Date | null;
  lastError: Error | null;
  pendingChanges: number;
}

export const useDataSync = <T>(
  key: string,
  initialData: T,
  endpoint?: string,
  autoSync: boolean = true,
  syncInterval: number | null = 60000
) => {
  const [state, setState] = useState<DataSyncState<T>>({
    data: initialData,
    isSyncing: false,
    isLoading: true,
    error: null,
    status: 'loading',
    lastSynced: null,
    lastError: null,
    pendingChanges: 0
  });
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();

  // Load local data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const localData = await dataSyncManager.getLocalData<T>(key);
        if (localData) {
          setState(prev => ({
            ...prev,
            data: localData,
            isLoading: false,
            status: 'success'
          }));
        } else if (endpoint && isOnline && autoSync) {
          await syncWithServer();
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
            status: 'idle',
            data: initialData
          }));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          lastError: error instanceof Error ? error : new Error('Unknown error')
        }));
      }
    };
    loadData();
  }, [key]);

  // Save data locally whenever it changes
  useEffect(() => {
    if (!state.isLoading) {
      dataSyncManager.saveLocalData(key, state.data)
        .catch(error => console.error('Error saving data locally:', error));
    }
  }, [state.data, key]);

  // Sync with server when online if autoSync is enabled
  useEffect(() => {
    if (autoSync && endpoint && isOnline && state.pendingChanges > 0 && !state.isSyncing) {
      const timer = setTimeout(syncWithServer, 2000); // Debounce sync
      return () => clearTimeout(timer);
    }
  }, [state.data, isOnline, autoSync, endpoint, state.pendingChanges, state.isSyncing]);

  // Method to sync with the server
  const syncWithServer = async (options?: SyncOptions) => {
    if (!endpoint || state.isSyncing) return false;

    setState(prev => ({ ...prev, isSyncing: true }));
    
    try {
      if (isOnline) {
        const success = await dataSyncManager.syncData(endpoint, state.data, options);
        
        if (success) {
          setState(prev => ({ 
            ...prev, 
            isSyncing: false, 
            lastSynced: new Date(),
            pendingChanges: 0,
            status: 'success',
            error: null
          }));
          return true;
        } else {
          throw new Error('Sync failed for unknown reason');
        }
      } else {
        toast({
          title: "Synchronisation impossible",
          description: "Vous êtes actuellement hors ligne",
          variant: "destructive"
        });
        setState(prev => ({ ...prev, isSyncing: false }));
        return false;
      }
    } catch (error) {
      console.error('Sync error:', error);
      setState(prev => ({ 
        ...prev, 
        isSyncing: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown sync error',
        lastError: error instanceof Error ? error : new Error('Unknown sync error')
      }));

      toast({
        title: "Échec de la synchronisation",
        description: `${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        variant: "destructive"
      });
      
      return false;
    }
  };

  // Update data
  const updateData = useCallback((newData: T | ((prev: T) => T)) => {
    setState(prev => {
      const updatedData = typeof newData === 'function' 
        ? (newData as ((prev: T) => T))(prev.data) 
        : newData;
      
      return {
        ...prev,
        data: updatedData,
        pendingChanges: prev.pendingChanges + 1
      };
    });
  }, []);

  // Reset to initial data
  const resetData = useCallback(() => {
    setState(prev => ({
      ...prev,
      data: initialData,
      pendingChanges: prev.pendingChanges + 1
    }));
    
    toast({
      title: "Données réinitialisées",
      description: "Les données ont été réinitialisées avec succès"
    });
  }, [initialData, toast]);

  return {
    ...state,
    updateData,
    resetData,
    syncWithServer,
    isOnline
  };
};
