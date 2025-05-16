
import React, { createContext, useContext, useState, useEffect } from 'react';

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

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    console.error("useSyncContext doit être utilisé à l'intérieur d'un SyncProvider");
    // Renvoyer une valeur par défaut pour éviter l'arrêt de l'application
    return {
      syncStatus: defaultSyncStatus,
      setSyncStatus: () => {},
      startSync: () => {},
      endSync: () => {}
    };
  }
  return context;
};

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(defaultSyncStatus);
  const [isProviderMounted, setIsProviderMounted] = useState(false);
  
  useEffect(() => {
    console.log("SyncProvider monté");
    setIsProviderMounted(true);
    
    return () => {
      console.log("SyncProvider démonté");
      setIsProviderMounted(false);
    };
  }, []);

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
  
  const contextValue = {
    syncStatus, 
    setSyncStatus, 
    startSync, 
    endSync
  };
  
  console.log("SyncProvider rendu avec état:", syncStatus, "Provider monté:", isProviderMounted);

  return (
    <SyncContext.Provider value={contextValue}>
      {children}
    </SyncContext.Provider>
  );
};

export default SyncContext;
