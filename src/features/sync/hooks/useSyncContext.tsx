
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { syncService } from '@/services/sync';
import { useToast } from '@/hooks/use-toast';

// Types pour la synchronisation
export interface SyncOptions {
  autoSync?: boolean;
  syncInterval?: number;
  retryOnFailure?: boolean;
  maxRetries?: number;
}

export interface SyncState {
  isSyncing: boolean;
  lastSynced: string | null;
  pendingOperations: number;
  error: string | null;
  syncFailed?: boolean;
  pendingSync?: boolean;
  dataChanged?: boolean;
}

export interface SyncOperationResult {
  success: boolean;
  message?: string;
  error?: string;
}

export enum SyncMonitorStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  ERROR = 'error'
}

export interface SyncContextType {
  isSyncEnabled: boolean;
  toggleSync: () => void;
  syncState: Record<string, SyncState>;
  syncTable: (tableName: string) => Promise<SyncOperationResult>;
  registerTable: (tableName: string) => void;
  unregisterTable: (tableName: string) => void;
  getSyncState: (tableName: string) => SyncState | null;
  resetSyncErrors: () => void;
  isOnline: boolean;
  performGlobalSync: () => Promise<boolean>;
  lastGlobalSync: string | null;
}

// Valeur par défaut pour le contexte
const defaultSyncContext: SyncContextType = {
  isSyncEnabled: true,
  toggleSync: () => {},
  syncState: {},
  syncTable: async () => ({ success: false }),
  registerTable: () => {},
  unregisterTable: () => {},
  getSyncState: () => null,
  resetSyncErrors: () => {},
  isOnline: true,
  performGlobalSync: async () => false,
  lastGlobalSync: null
};

// Créer le contexte
const SyncContext = createContext<SyncContextType>(defaultSyncContext);

// Hook pour utiliser le contexte
export const useSyncContext = () => useContext(SyncContext);

// Provider pour le contexte
export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSyncEnabled, setIsSyncEnabled] = useState<boolean>(true);
  const [syncState, setSyncState] = useState<Record<string, SyncState>>({});
  const [lastGlobalSync, setLastGlobalSync] = useState<string | null>(null);
  const isOnline = useNetworkStatus();
  const { toast } = useToast();

  // Fonction pour basculer la synchronisation
  const toggleSync = useCallback(() => {
    setIsSyncEnabled(prev => !prev);
  }, []);

  // Fonction pour enregistrer une table
  const registerTable = useCallback((tableName: string) => {
    setSyncState(prev => {
      if (prev[tableName]) {
        return prev;
      }
      
      return {
        ...prev,
        [tableName]: {
          isSyncing: false,
          lastSynced: null,
          pendingOperations: 0,
          error: null,
          syncFailed: false,
          pendingSync: false,
          dataChanged: false
        }
      };
    });
  }, []);

  // Fonction pour désinscrire une table
  const unregisterTable = useCallback((tableName: string) => {
    setSyncState(prev => {
      const newState = { ...prev };
      delete newState[tableName];
      return newState;
    });
  }, []);

  // Fonction pour synchroniser une table
  const syncTable = useCallback(async (tableName: string): Promise<SyncOperationResult> => {
    if (!isSyncEnabled || !isOnline) {
      return { 
        success: false, 
        message: !isSyncEnabled 
          ? "La synchronisation est désactivée" 
          : "Aucune connexion réseau" 
      };
    }

    // Vérifier si la table est enregistrée
    if (!syncState[tableName]) {
      registerTable(tableName);
    }

    // Mettre à jour l'état de la synchronisation
    setSyncState(prev => ({
      ...prev,
      [tableName]: {
        ...prev[tableName],
        isSyncing: true,
        error: null,
        syncFailed: false
      }
    }));

    try {
      // Effectuer la synchronisation
      const result = await syncService.syncTable(tableName);
      
      // Mettre à jour l'état après la synchronisation
      setSyncState(prev => ({
        ...prev,
        [tableName]: {
          ...prev[tableName],
          isSyncing: false,
          lastSynced: new Date().toISOString(),
          pendingOperations: 0,
          error: null,
          syncFailed: false,
          pendingSync: false,
          dataChanged: true
        }
      }));
      
      return { success: true };
    } catch (error) {
      // Gérer les erreurs
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      
      setSyncState(prev => ({
        ...prev,
        [tableName]: {
          ...prev[tableName],
          isSyncing: false,
          error: errorMessage,
          syncFailed: true
        }
      }));
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }, [isSyncEnabled, isOnline, registerTable, syncState]);

  // Fonction pour obtenir l'état de synchronisation d'une table
  const getSyncState = useCallback((tableName: string): SyncState | null => {
    return syncState[tableName] || null;
  }, [syncState]);

  // Fonction pour réinitialiser les erreurs de synchronisation
  const resetSyncErrors = useCallback(() => {
    setSyncState(prev => {
      const newState = { ...prev };
      
      Object.keys(newState).forEach(tableName => {
        newState[tableName] = {
          ...newState[tableName],
          error: null,
          syncFailed: false
        };
      });
      
      return newState;
    });
  }, []);

  // Fonction pour effectuer une synchronisation globale
  const performGlobalSync = useCallback(async (): Promise<boolean> => {
    if (!isSyncEnabled || !isOnline) {
      toast({
        title: "Synchronisation impossible",
        description: !isSyncEnabled 
          ? "La synchronisation est désactivée" 
          : "Aucune connexion réseau",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Synchroniser toutes les tables enregistrées
      const tables = Object.keys(syncState);
      let hasErrors = false;
      
      for (const tableName of tables) {
        const result = await syncTable(tableName);
        if (!result.success) {
          hasErrors = true;
        }
      }
      
      // Mettre à jour la date de dernière synchronisation globale
      setLastGlobalSync(new Date().toISOString());
      
      if (hasErrors) {
        toast({
          title: "Synchronisation partielle",
          description: "Certaines tables n'ont pas pu être synchronisées",
          variant: "warning"
        });
      } else {
        toast({
          title: "Synchronisation réussie",
          description: "Toutes les données ont été synchronisées",
        });
      }
      
      return !hasErrors;
    } catch (error) {
      toast({
        title: "Erreur de synchronisation",
        description: "Une erreur est survenue lors de la synchronisation",
        variant: "destructive"
      });
      
      return false;
    }
  }, [isSyncEnabled, isOnline, syncState, syncTable, toast]);

  // Valeur du contexte
  const contextValue: SyncContextType = {
    isSyncEnabled,
    toggleSync,
    syncState,
    syncTable,
    registerTable,
    unregisterTable,
    getSyncState,
    resetSyncErrors,
    isOnline,
    performGlobalSync,
    lastGlobalSync
  };

  return (
    <SyncContext.Provider value={contextValue}>
      {children}
    </SyncContext.Provider>
  );
};

export default SyncContext;
