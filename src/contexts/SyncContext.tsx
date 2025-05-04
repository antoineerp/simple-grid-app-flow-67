
import React, { createContext, ReactNode } from 'react';

// Types pour la compatibilité
interface SyncContextType {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: null;
  startSync: () => Promise<boolean>;
  syncStatus: 'success';
}

// Valeurs par défaut pour le contexte - version totalement neutralisée
const defaultSyncContext: SyncContextType = {
  isSyncing: false,
  lastSyncTime: new Date(),
  syncError: null,
  startSync: async () => true,
  syncStatus: 'success'
};

// Création du contexte
const SyncContext = createContext<SyncContextType>(defaultSyncContext);

// Hook personnalisé pour utiliser le contexte
export const useSyncContext = () => defaultSyncContext;

interface SyncProviderProps {
  children: ReactNode;
}

// Composant fournisseur qui ne fait plus rien
export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  return <SyncContext.Provider value={defaultSyncContext}>{children}</SyncContext.Provider>;
};

export default SyncContext;
