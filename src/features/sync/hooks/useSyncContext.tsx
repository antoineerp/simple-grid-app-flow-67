
/**
 * Redirecteur vers la nouvelle solution de synchronisation centralisée
 * Pour maintenir la compatibilité avec le code existant
 */

import { createContext, useContext } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { 
  syncWithServer, 
  forceSync, 
  setSyncEnabled, 
  hasPendingChanges, 
  getLastSynced 
} from '@/services/sync/AutoSyncService';
import { SyncHookOptions, SyncState, SyncOperationResult, SyncMonitorStatus } from '../types/syncTypes';

// Type minimal pour le contexte pour maintenir la compatibilité
interface SyncContextType {
  syncTable: <T>(tableName: string, data: T[], trigger?: "auto" | "manual" | "initial") => Promise<SyncOperationResult>;
  syncAll: () => Promise<Record<string, boolean>>;
  syncStates: Record<string, SyncState>;
  isOnline: boolean;
  monitorStatus: SyncMonitorStatus;
  forceProcessQueue: () => void;
  syncWithServer?: <T>(data: T[], additionalData?: any, userId?: string) => Promise<boolean>;
  notifyChanges?: () => void;
}

// Créer des valeurs par défaut qui redirigent vers le nouveau système
const defaultContext: SyncContextType = {
  syncTable: async (tableName, data) => {
    console.log("useSyncContext (redirecteur): syncTable -> AutoSyncService");
    const success = await syncWithServer(tableName, data);
    return { success, message: success ? "success" : "error" };
  },
  syncAll: async () => {
    console.log("useSyncContext (redirecteur): syncAll -> AutoSyncService");
    const results = await forceSync();
    return results;
  },
  syncStates: {},
  isOnline: navigator.onLine,
  monitorStatus: { 
    activeCount: 0, 
    recentAttempts: [],
    stats: { success: 0, failure: 0 },
    health: 'good',
    lastSync: { time: null, success: false }
  },
  forceProcessQueue: () => {
    console.log("useSyncContext (redirecteur): forceProcessQueue -> AutoSyncService.forceSync");
    forceSync().catch(err => console.error("Erreur lors du forçage de la synchronisation:", err));
  },
  syncWithServer: async (data, additionalData) => {
    console.log("useSyncContext (redirecteur): syncWithServer -> AutoSyncService");
    const tableName = additionalData?.tableName || 'default';
    return await syncWithServer(tableName, data);
  },
  notifyChanges: () => {
    console.log("useSyncContext (redirecteur): notifyChanges -> AutoSyncService (no-op)");
  }
};

// Créer un contexte qui utilise le système unique de synchronisation
const SyncContext = createContext<SyncContextType>(defaultContext);

/**
 * Provider pour maintenir la compatibilité avec le code existant
 * Redirige vers la nouvelle solution de synchronisation
 */
export const SyncProvider: React.FC<{
  children: React.ReactNode;
  options?: SyncHookOptions;
}> = ({ children }) => {
  const { isOnline } = useNetworkStatus();
  
  // Utiliser le provider simple qui redirige vers AutoSyncService
  return (
    <SyncContext.Provider value={{
      ...defaultContext,
      isOnline
    }}>
      {children}
    </SyncContext.Provider>
  );
};

// Hook pour la compatibilité
export const useSyncContext = () => useContext(SyncContext);

// Pour la compatibilité
export * from '../types/syncTypes';
