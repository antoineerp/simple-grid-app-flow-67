
import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { toast } from '@/components/ui/use-toast';
import { SyncMonitorStatus } from '../types/syncTypes';

// Types pour le contexte de synchronisation
export interface SyncContextType {
  syncAll: () => Promise<Record<string, boolean>>;
  forceProcessQueue: () => Promise<void>;
  forceSync: (tableId: string) => Promise<boolean>;
  registerSyncFunction: (key: string, syncFn: () => Promise<boolean>) => void;
  unregisterSyncFunction: (key: string) => void;
  getSyncState: (tableId?: string) => SyncState;
  isInitialized: () => boolean;
  isSyncEnabled: () => boolean;
  isOnline: boolean;
  syncStates: Record<string, TableSyncState>;
}

export interface SyncState {
  isSyncing: boolean;
  lastSynced: Date | null;
  error: string | null;
}

export interface TableSyncState {
  isSyncing: boolean;
  lastSynced: Date | null;
  syncFailed: boolean;
  errorMessage?: string;
}

// Contexte de synchronisation
const SyncContext = createContext<SyncContextType | undefined>(undefined);

// État global pour la synchronisation
const globalSyncState = {
  isOnline: true,
  isSyncEnabled: true,
  initialized: false,
  syncFunctions: new Map<string, () => Promise<boolean>>(),
  tableSyncStates: {} as Record<string, TableSyncState>
};

// Provider de synchronisation
export const SyncProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncStates, setSyncStates] = useState<Record<string, TableSyncState>>({});

  // Détecter l'état de la connexion
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Déclencher un événement personnalisé lorsque la connectivité est restaurée
      window.dispatchEvent(new CustomEvent('connectivity-restored'));
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initialiser l'état
    globalSyncState.initialized = true;
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Mettre à jour l'état global quand l'état local change
  useEffect(() => {
    globalSyncState.isOnline = isOnline;
    globalSyncState.tableSyncStates = syncStates;
  }, [isOnline, syncStates]);

  // Enregistrer une fonction de synchronisation
  const registerSyncFunction = (key: string, syncFn: () => Promise<boolean>) => {
    globalSyncState.syncFunctions.set(key, syncFn);
    
    // Initialiser l'état de synchronisation si nécessaire
    setSyncStates(prev => {
      if (!prev[key]) {
        return {
          ...prev,
          [key]: {
            isSyncing: false,
            lastSynced: null,
            syncFailed: false
          }
        };
      }
      return prev;
    });
    
    console.log(`SyncContext: Fonction de synchronisation enregistrée: ${key}`);
  };

  // Désenregistrer une fonction de synchronisation
  const unregisterSyncFunction = (key: string) => {
    globalSyncState.syncFunctions.delete(key);
    console.log(`SyncContext: Fonction de synchronisation supprimée: ${key}`);
  };

  // Synchroniser une table spécifique
  const forceSync = async (tableId: string): Promise<boolean> => {
    if (!globalSyncState.syncFunctions.has(tableId)) {
      console.error(`SyncContext: Aucune fonction de synchronisation pour: ${tableId}`);
      return false;
    }
    
    // Mettre à jour l'état
    setSyncStates(prev => ({
      ...prev,
      [tableId]: {
        ...(prev[tableId] || { lastSynced: null }),
        isSyncing: true,
        syncFailed: false
      }
    }));
    
    try {
      const syncFn = globalSyncState.syncFunctions.get(tableId)!;
      const result = await syncFn();
      
      // Mettre à jour l'état
      setSyncStates(prev => ({
        ...prev,
        [tableId]: {
          isSyncing: false,
          lastSynced: new Date(),
          syncFailed: !result,
          errorMessage: result ? undefined : "Échec de la synchronisation"
        }
      }));
      
      return result;
    } catch (error) {
      console.error(`SyncContext: Erreur lors de la synchronisation de ${tableId}:`, error);
      
      // Mettre à jour l'état
      setSyncStates(prev => ({
        ...prev,
        [tableId]: {
          isSyncing: false,
          lastSynced: prev[tableId]?.lastSynced || null,
          syncFailed: true,
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      }));
      
      return false;
    }
  };

  // Synchroniser toutes les tables
  const syncAll = async (): Promise<Record<string, boolean>> => {
    if (!isOnline) {
      toast({
        title: "Hors ligne",
        description: "Impossible de synchroniser en mode hors ligne",
        variant: "destructive"
      });
      return {};
    }
    
    console.log("SyncContext: Début de la synchronisation globale...");
    
    const results: Record<string, boolean> = {};
    const tables = Array.from(globalSyncState.syncFunctions.keys());
    
    for (const tableId of tables) {
      results[tableId] = await forceSync(tableId);
    }
    
    const allSuccess = Object.values(results).every(success => success);
    
    toast({
      title: allSuccess ? "Synchronisation réussie" : "Synchronisation partiellement échouée",
      description: allSuccess 
        ? "Toutes les données ont été synchronisées avec succès"
        : "Certaines tables n'ont pas pu être synchronisées",
      variant: allSuccess ? "default" : "destructive"
    });
    
    return results;
  };

  // Force le traitement de la file d'attente des opérations de synchronisation
  const forceProcessQueue = async (): Promise<void> => {
    console.log("SyncContext: Traitement forcé de la file d'attente de synchronisation");
    // Dans cette implémentation simple, nous ne faisons rien de particulier
  };

  // Obtenir l'état de synchronisation
  const getSyncState = (tableId?: string): SyncState => {
    if (tableId) {
      const tableState = syncStates[tableId];
      
      if (tableState) {
        return {
          isSyncing: tableState.isSyncing,
          lastSynced: tableState.lastSynced,
          error: tableState.syncFailed ? (tableState.errorMessage || "Erreur inconnue") : null
        };
      }
    }
    
    // État global
    return {
      isSyncing: Object.values(syncStates).some(state => state.isSyncing),
      lastSynced: getLatestSyncDate(syncStates),
      error: Object.values(syncStates).some(state => state.syncFailed) ? "Une ou plusieurs synchronisations ont échoué" : null
    };
  };

  // Vérifier si le contexte est initialisé
  const isInitialized = (): boolean => {
    return globalSyncState.initialized;
  };

  // Vérifier si la synchronisation est activée
  const isSyncEnabled = (): boolean => {
    return globalSyncState.isSyncEnabled;
  };

  // Valeur du contexte
  const value = useMemo<SyncContextType>(() => ({
    syncAll,
    forceProcessQueue,
    forceSync,
    registerSyncFunction,
    unregisterSyncFunction,
    getSyncState,
    isInitialized,
    isSyncEnabled,
    isOnline,
    syncStates
  }), [isOnline, syncStates]);

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte de synchronisation
export const useSyncContext = (): SyncContextType => {
  const context = useContext(SyncContext);
  
  if (context === undefined) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  
  return context;
};

// Utilitaire pour obtenir la date de dernière synchronisation la plus récente
const getLatestSyncDate = (syncStates: Record<string, TableSyncState>): Date | null => {
  let latestDate: Date | null = null;
  
  Object.values(syncStates).forEach(state => {
    if (state.lastSynced && (!latestDate || state.lastSynced > latestDate)) {
      latestDate = state.lastSynced;
    }
  });
  
  return latestDate;
};

export default { SyncProvider, useSyncContext };
