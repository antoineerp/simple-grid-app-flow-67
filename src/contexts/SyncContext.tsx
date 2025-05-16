
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { syncService } from '@/services/core/syncService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

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
  // Ajout des propriétés manquantes qui causaient des erreurs
  syncStatus: {
    isSyncing: boolean;
    lastSynced: Date | null;
    error: string | null;
  };
  startSync: (tableName: string) => void;
  endSync: (tableName: string, error?: string | null) => void;
}

// Créer un contexte avec une valeur par défaut pour éviter les erreurs
const defaultContextValue: SyncContextProps = {
  lastSynced: {},
  isSyncing: {},
  syncErrors: {},
  isOnline: true,
  isInitialized: () => false,
  syncData: async () => false,
  loadData: async () => [],
  getLastSynced: () => null,
  getSyncError: () => null,
  // Valeurs par défaut pour les nouvelles propriétés
  syncStatus: {
    isSyncing: false,
    lastSynced: null,
    error: null
  },
  startSync: () => {},
  endSync: () => {}
};

const SyncContext = createContext<SyncContextProps>(defaultContextValue);

export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lastSynced, setLastSynced] = useState<Record<string, Date | null>>({});
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});
  const [syncErrors, setSyncErrors] = useState<Record<string, string | null>>({});
  const [initialized, setInitialized] = useState(false);
  const { isOnline } = useNetworkStatus();
  const [globalSyncStatus, setGlobalSyncStatus] = useState({
    isSyncing: false,
    lastSynced: null as Date | null,
    error: null as string | null
  });

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

  const startSync = (tableName: string) => {
    setIsSyncing(prev => ({ ...prev, [tableName]: true }));
    setGlobalSyncStatus(prev => ({ ...prev, isSyncing: true }));
  };

  const endSync = (tableName: string, error: string | null = null) => {
    setIsSyncing(prev => ({ ...prev, [tableName]: false }));
    setSyncErrors(prev => ({ ...prev, [tableName]: error }));
    
    if (!error) {
      const now = new Date();
      setLastSynced(prev => ({ ...prev, [tableName]: now }));
      setGlobalSyncStatus(prev => ({ ...prev, lastSynced: now, isSyncing: false, error: null }));
    } else {
      setGlobalSyncStatus(prev => ({ ...prev, isSyncing: false, error }));
    }
  };

  const syncData = async <T extends {}>(tableName: string, data: T[]): Promise<boolean> => {
    try {
      startSync(tableName);
      setSyncErrors(prev => ({ ...prev, [tableName]: null }));
      
      console.log(`SyncContext - Début de la synchronisation pour ${tableName}`);
      let result = false;
      
      // Récupérer l'identifiant de l'utilisateur actuel pour garantir l'isolation des données
      const currentUser = getCurrentUser();
      const userId = currentUser?.identifiant_technique;
      
      if (!userId) {
        throw new Error("Utilisateur non authentifié");
      }
      
      try {
        // Passer l'ID utilisateur pour assurer l'isolation des données
        result = await Promise.resolve(syncService.sendDataToServer<T>(tableName, data, userId));
      } catch (error) {
        console.error(`SyncContext - Erreur lors de la synchronisation pour ${tableName}:`, error);
        throw error;
      }
        
      console.log(`SyncContext - Synchronisation terminée pour ${tableName}`);
      const now = new Date();
      setLastSynced(prev => ({ ...prev, [tableName]: now }));
      endSync(tableName);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error(`SyncContext - Erreur capturée pour ${tableName}:`, errorMsg);
      setSyncErrors(prev => ({ ...prev, [tableName]: errorMsg }));
      endSync(tableName, errorMsg);
      return false;
    }
  };

  const loadData = async <T extends {}>(tableName: string): Promise<T[]> => {
    try {
      startSync(tableName);
      setSyncErrors(prev => ({ ...prev, [tableName]: null }));
      
      // Récupérer l'identifiant de l'utilisateur actuel pour garantir l'isolation des données
      const currentUser = getCurrentUser();
      const userId = currentUser?.identifiant_technique;
      
      if (!userId) {
        throw new Error("Utilisateur non authentifié");
      }
      
      console.log(`SyncContext - Chargement des données pour ${tableName} (utilisateur: ${userId})`);
      let data: T[] = [];
      
      try {
        // Passer l'ID utilisateur pour assurer l'isolation des données
        data = await Promise.resolve(syncService.loadDataFromServer<T>(tableName, userId));
      } catch (error) {
        console.error(`SyncContext - Erreur lors du chargement pour ${tableName}:`, error);
        throw error;
      }
        
      console.log(`SyncContext - Chargement terminé pour ${tableName}, ${data.length} éléments`);
      const now = new Date();
      setLastSynced(prev => ({ ...prev, [tableName]: now }));
      endSync(tableName);
      return data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error(`SyncContext - Erreur capturée lors du chargement pour ${tableName}:`, errorMsg);
      setSyncErrors(prev => ({ ...prev, [tableName]: errorMsg }));
      endSync(tableName, errorMsg);
      
      // En cas d'erreur, retournons un tableau vide plutôt que de lever une exception
      return [] as T[];
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
    getSyncError: (tableName: string) => syncErrors[tableName] || null,
    syncStatus: globalSyncStatus,
    startSync,
    endSync
  };

  return (
    <SyncContext.Provider value={contextValue}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSyncContext = (): SyncContextProps => {
  const context = useContext(SyncContext);
  
  // Si le contexte n'est pas défini, utiliser la valeur par défaut au lieu de lever une exception
  if (context === undefined) {
    console.error('useSyncContext doit être utilisé à l\'intérieur d\'un SyncProvider');
    return defaultContextValue;
  }
  
  return context;
};
