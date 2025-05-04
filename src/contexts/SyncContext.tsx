
import React, { createContext, useState, useContext, ReactNode } from 'react';

// Types pour le contexte de synchronisation
interface SyncContextType {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
  startSync: () => Promise<boolean>;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
}

// Valeurs par défaut pour le contexte
const defaultSyncContext: SyncContextType = {
  isSyncing: false,
  lastSyncTime: null,
  syncError: null,
  startSync: async () => false,
  syncStatus: 'idle'
};

// Création du contexte
const SyncContext = createContext<SyncContextType>(defaultSyncContext);

// Hook personnalisé pour utiliser le contexte
export const useSyncContext = () => useContext(SyncContext);

interface SyncProviderProps {
  children: ReactNode;
}

// Composant fournisseur pour le contexte de synchronisation
export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Fonction simulée de synchronisation (désactivée pour cette application)
  const startSync = async (): Promise<boolean> => {
    console.log("Fonctionnalité de synchronisation désactivée");
    // Simuler une synchronisation réussie
    setLastSyncTime(new Date());
    return true;
  };

  // Valeurs à fournir au contexte
  const value: SyncContextType = {
    isSyncing,
    lastSyncTime,
    syncError,
    startSync,
    syncStatus
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export default SyncContext;
