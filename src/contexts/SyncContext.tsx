
import React, { createContext, useContext, useState, ReactNode } from 'react';

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

// Création d'un contexte vide
const SyncContext = createContext<SyncContextProps | undefined>(undefined);

// Provider qui ne fait rien de réel
export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Valeurs factices
  const contextValue: SyncContextProps = {
    lastSynced: {},
    isSyncing: {},
    syncErrors: {},
    isOnline: true,
    isInitialized: () => true,
    syncData: async <T>(tableName: string, data: T[]) => {
      console.log(`Synchronisation désactivée pour ${tableName}`);
      return true;
    },
    loadData: async <T>(tableName: string) => {
      console.log(`Chargement désactivé pour ${tableName}`);
      return [] as T[];
    },
    getLastSynced: () => new Date(),
    getSyncError: () => null
  };

  return (
    <SyncContext.Provider value={contextValue}>
      {children}
    </SyncContext.Provider>
  );
};

// Hook d'utilisation du contexte qui retourne des valeurs par défaut si non disponible
export const useSyncContext = (): SyncContextProps => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    // Valeurs par défaut au lieu de lancer une erreur
    return {
      lastSynced: {},
      isSyncing: {},
      syncErrors: {},
      isOnline: true,
      isInitialized: () => true,
      syncData: async () => true,
      loadData: async () => [],
      getLastSynced: () => new Date(),
      getSyncError: () => null
    };
  }
  return context;
};
