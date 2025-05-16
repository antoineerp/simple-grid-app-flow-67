
import React, { createContext, useContext, useState } from 'react';

export interface SyncStatus {
  isSyncing: boolean;
  lastSynced: Date | null;
  syncFailed: boolean;
  error?: string;
}

interface SyncContextType {
  syncStatus: SyncStatus;
  setSyncStatus: React.Dispatch<React.SetStateAction<SyncStatus>>;
  startSync: (entityType: string) => void;
  endSync: (entityType: string, success: boolean, error?: string) => void;
}

const defaultSyncStatus: SyncStatus = {
  isSyncing: false,
  lastSynced: null,
  syncFailed: false,
};

const SyncContext = createContext<SyncContextType>({
  syncStatus: defaultSyncStatus,
  setSyncStatus: () => {},
  startSync: () => {},
  endSync: () => {},
});

export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
};

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(defaultSyncStatus);

  const startSync = (entityType: string) => {
    console.log(`Starting sync for: ${entityType}`);
    setSyncStatus({
      isSyncing: true,
      lastSynced: syncStatus.lastSynced,
      syncFailed: false,
    });
  };

  const endSync = (entityType: string, success: boolean, error?: string) => {
    console.log(`Ending sync for ${entityType}: ${success ? 'Success' : 'Failed'}`);
    setSyncStatus({
      isSyncing: false,
      lastSynced: success ? new Date() : syncStatus.lastSynced,
      syncFailed: !success,
      error: error,
    });
  };

  return (
    <SyncContext.Provider value={{ syncStatus, setSyncStatus, startSync, endSync }}>
      {children}
    </SyncContext.Provider>
  );
};

export default SyncContext;
