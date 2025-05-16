
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
    try {
      console.log("SyncContext - Initialisation du contexte");
      const tables = ['membres', 'exigences', 'documents', 'collaboration', 'audits'];
      const syncState: Record<string, Date | null> = {};
      const syncingState: Record<string, boolean> = {};
      const errorsState: Record<string, string | null> = {};
      
      tables.forEach(table => {
        try {
          syncState[table] = syncService.getLastSynced(table);
          syncingState[table] = syncService.isSyncingTable(table);
          errorsState[table] = syncService.getLastError(table);
        } catch (e) {
          console.error(`SyncContext - Erreur lors de l'initialisation pour table ${table}:`, e);
          syncState[table] = null;
          syncingState[table] = false;
          errorsState[table] = e instanceof Error ? e.message : "Erreur inconnue";
        }
      });
      
      setLastSynced(syncState);
      setIsSyncing(syncingState);
      setSyncErrors(errorsState);
      console.log("SyncContext - Initialisation terminée");
    } catch (e) {
      console.error("SyncContext - Erreur générale d'initialisation:", e);
    } finally {
      setInitialized(true);
    }
  }, []);

  const syncData = async <T extends {}>(tableName: string, data: T[]): Promise<boolean> => {
    try {
      setIsSyncing(prev => ({ ...prev, [tableName]: true }));
      setSyncErrors(prev => ({ ...prev, [tableName]: null }));
      
      console.log(`SyncContext - Début de la synchronisation pour ${tableName}`);
      const result = await Promise.resolve(syncService.sendDataToServer<T>(tableName, data))
        .catch(error => {
          console.error(`SyncContext - Erreur lors de la synchronisation pour ${tableName}:`, error);
          throw error;
        });
        
      console.log(`SyncContext - Synchronisation terminée pour ${tableName}`);
      setLastSynced(prev => ({ ...prev, [tableName]: new Date() }));
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error(`SyncContext - Erreur capturée pour ${tableName}:`, errorMsg);
      setSyncErrors(prev => ({ ...prev, [tableName]: errorMsg }));
      return false;
    } finally {
      setIsSyncing(prev => ({ ...prev, [tableName]: false }));
    }
  };

  const loadData = async <T extends {}>(tableName: string): Promise<T[]> => {
    try {
      setIsSyncing(prev => ({ ...prev, [tableName]: true }));
      setSyncErrors(prev => ({ ...prev, [tableName]: null }));
      
      console.log(`SyncContext - Chargement des données pour ${tableName}`);
      const data = await Promise.resolve(syncService.loadDataFromServer<T>(tableName))
        .catch(error => {
          console.error(`SyncContext - Erreur lors du chargement pour ${tableName}:`, error);
          throw error;
        });
        
      console.log(`SyncContext - Chargement terminé pour ${tableName}, ${data.length} éléments`);
      setLastSynced(prev => ({ ...prev, [tableName]: new Date() }));
      return data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error(`SyncContext - Erreur capturée lors du chargement pour ${tableName}:`, errorMsg);
      setSyncErrors(prev => ({ ...prev, [tableName]: errorMsg }));
      
      // En cas d'erreur, retournons un tableau vide plutôt que de lever une exception
      return [] as T[];
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
