
import { createContext, useContext } from 'react';

export interface SyncState {
  isSyncing: boolean;
  syncFailed: boolean;
  lastSynced: number | null;
  errorMessage: string | null;
  hasPendingChanges: boolean;
}

export interface SyncContextType {
  syncStates: Record<string, SyncState>;
  monitorStatus: (tableName: string) => SyncState | null;
  startSync: (tableName: string) => Promise<boolean>;
  forceSync: (tableName: string) => Promise<boolean>;
  refreshStatus: (tableName: string) => void;
  markSynced: (tableName: string) => void;
  markFailed: (tableName: string, errorMessage: string) => void;
}

export const SyncContext = createContext<SyncContextType>({
  syncStates: {},
  monitorStatus: () => null,
  startSync: async () => false,
  forceSync: async () => false,
  refreshStatus: () => {},
  markSynced: () => {},
  markFailed: () => {},
});

export const useSyncContext = () => useContext(SyncContext);

export interface SyncProviderOptions {
  showToasts?: boolean;
  autoSync?: boolean;
  autoSyncInterval?: number;
}

// Dummy SyncProvider for import resolution
export const SyncProvider = ({ children }: { children: React.ReactNode; options?: SyncProviderOptions }) => {
  return <>{children}</>;
};
