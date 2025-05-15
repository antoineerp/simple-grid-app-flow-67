
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { triggerSync, triggerTableSync } from '@/services/sync';

interface SyncStatus {
  isLoading: boolean;
  lastSynced: Date | null;
  error: string | null;
  syncFailed?: boolean;
}

interface SyncStatuses {
  [tableName: string]: SyncStatus;
}

interface SyncResult {
  [tableName: string]: boolean;
}

interface GlobalSyncContextType {
  syncStatuses: SyncStatuses;
  syncStates: SyncStatuses; // Alias pour compatibilité avec le code existant
  syncTable: (tableName: string) => Promise<boolean>;
  syncAll: () => Promise<SyncResult>;
  isSyncing: (tableName: string) => boolean;
  getLastSynced: (tableName: string) => Date | null;
  getSyncError: (tableName: string) => string | null;
  isOnline: boolean;
}

const GlobalSyncContext = createContext<GlobalSyncContextType | undefined>(undefined);

export const GlobalSyncProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [syncStatuses, setSyncStatuses] = useState<SyncStatuses>({});
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Surveiller l'état de la connexion
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncTable = async (tableName: string): Promise<boolean> => {
    try {
      // Update status to loading
      setSyncStatuses(prev => ({
        ...prev,
        [tableName]: {
          isLoading: true,
          lastSynced: prev[tableName]?.lastSynced || null,
          error: null,
          syncFailed: false
        }
      }));

      // Trigger sync
      const result = await triggerTableSync(tableName);

      // Update status based on result
      setSyncStatuses(prev => ({
        ...prev,
        [tableName]: {
          isLoading: false,
          lastSynced: result ? new Date() : prev[tableName]?.lastSynced || null,
          error: result ? null : 'Sync failed',
          syncFailed: !result
        }
      }));

      return result;
    } catch (error) {
      // Update status with error
      setSyncStatuses(prev => ({
        ...prev,
        [tableName]: {
          isLoading: false,
          lastSynced: prev[tableName]?.lastSynced || null,
          error: error instanceof Error ? error.message : 'Unknown error',
          syncFailed: true
        }
      }));
      return false;
    }
  };

  const syncAll = async (): Promise<SyncResult> => {
    const tables = ['documents', 'membres', 'exigences', 'bibliotheque', 'settings'];
    const results: SyncResult = {};

    for (const table of tables) {
      results[table] = await syncTable(table);
    }

    return results;
  };

  const isSyncing = (tableName: string): boolean => {
    return syncStatuses[tableName]?.isLoading || false;
  };

  const getLastSynced = (tableName: string): Date | null => {
    return syncStatuses[tableName]?.lastSynced || null;
  };

  const getSyncError = (tableName: string): string | null => {
    return syncStatuses[tableName]?.error || null;
  };

  return (
    <GlobalSyncContext.Provider value={{
      syncStatuses,
      syncStates: syncStatuses, // Alias pour compatibilité
      syncTable,
      syncAll,
      isSyncing,
      getLastSynced,
      getSyncError,
      isOnline
    }}>
      {children}
    </GlobalSyncContext.Provider>
  );
};

export const useGlobalSync = (): GlobalSyncContextType => {
  const context = useContext(GlobalSyncContext);
  if (context === undefined) {
    throw new Error('useGlobalSync must be used within a GlobalSyncProvider');
  }
  return context;
};
