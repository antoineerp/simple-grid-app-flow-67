
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { syncService } from '@/services/core/syncService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface SyncContextProps {
  lastSynced: Record<string, Date | null>;
  isSyncing: Record<string, boolean>;
  syncErrors: Record<string, string | null>;
  isOnline: boolean;
  isInitialized: () => boolean;
  syncData: <T>(tableName: string, data: T[]) => Promise<boolean>;
  loadData: <T>(tableName: string) => Promise<T[]>;
  getLastSynced: (tableName: string) => Date | null;
  getSyncError: (tableName: string) => string | null;
}

const SyncContext = createContext<SyncContextProps | undefined>(undefined);

export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lastSynced, setLastSynced] = useState<Record<string, Date | null>>({});
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});
  const [syncErrors, setSyncErrors] = useState<Record<string, string | null>>({});
  const [initialized, setInitialized] = useState(false);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    // Initialiser l'état avec les données du service
    const tables = ['membres', 'exigences', 'documents', 'collaboration', 'audits'];
    const syncState: Record<string, Date | null> = {};
    const syncingState: Record<string, boolean> = {};
    const errorsState: Record<string, string | null> = {};
    
    tables.forEach(table => {
      syncState[table] = syncService.getLastSynced(table);
      syncingState[table] = syncService.isSyncingTable(table);
      errorsState[table] = syncService.getLastError(table);
    });
    
    setLastSynced(syncState);
    setIsSyncing(syncingState);
    setSyncErrors(errorsState);
    setInitialized(true);
  }, []);

  const syncData = async <T extends {}>(tableName: string, data: T[]): Promise<boolean> => {
    setIsSyncing(prev => ({ ...prev, [tableName]: true }));
    setSyncErrors(prev => ({ ...prev, [tableName]: null }));
    
    try {
      const result = await syncService.sendDataToServer<T>(tableName, data);
      setLastSynced(prev => ({ ...prev, [tableName]: new Date() }));
      setSyncErrors(prev => ({ ...prev, [tableName]: null }));
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      setSyncErrors(prev => ({ ...prev, [tableName]: errorMsg }));
      return false;
    } finally {
      setIsSyncing(prev => ({ ...prev, [tableName]: false }));
    }
  };

  const loadData = async <T extends {}>(tableName: string): Promise<T[]> => {
    setIsSyncing(prev => ({ ...prev, [tableName]: true }));
    setSyncErrors(prev => ({ ...prev, [tableName]: null }));
    
    try {
      const data = await syncService.loadDataFromServer<T>(tableName);
      setLastSynced(prev => ({ ...prev, [tableName]: new Date() }));
      setSyncErrors(prev => ({ ...prev, [tableName]: null }));
      return data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      setSyncErrors(prev => ({ ...prev, [tableName]: errorMsg }));
      throw error;
    } finally {
      setIsSyncing(prev => ({ ...prev, [tableName]: false }));
    }
  };

  const contextValue: SyncContextProps = {
    lastSynced,
    isSyncing,
    syncErrors,
    isOnline,
    isInitialized: () => initialized,
    syncData,
    loadData,
    getLastSynced: (tableName: string) => lastSynced[tableName] || null,
    getSyncError: (tableName: string) => syncErrors[tableName] || null
  };

  return (
    <SyncContext.Provider value={contextValue}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSyncContext = (): SyncContextProps => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
};
