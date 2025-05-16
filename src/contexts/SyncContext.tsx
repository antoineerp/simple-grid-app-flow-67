
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser } from '@/services/auth/authService';

interface SyncContextProps {
  isOnline: boolean;
  isSyncing: Record<string, boolean>;
  lastSynced: Record<string, Date | null>;
  syncErrors: Record<string, string | null>;
  syncData: <T>(tableName: string, data: T[]) => Promise<boolean>;
  loadData: <T>(tableName: string) => Promise<T[]>;
  startSync: (tableName: string) => void;
  endSync: (tableName: string, error?: string | null) => void;
  getLastSynced: (tableName: string) => Date | null;
  getSyncError: (tableName: string) => string | null;
  isInitialized: Record<string, boolean>;
  clearSyncErrors: () => void;
  forceSyncAll: () => Promise<void>;
}

const SyncContext = createContext<SyncContextProps | undefined>(undefined);

export const useSyncContext = (): SyncContextProps => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
};

interface SyncProviderProps {
  children: React.ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({
    documents: false,
    exigences: false,
    membres: false,
    bibliotheque: false,
    'test_table': false,
    'collaboration': false,
    'collaboration_groups': false
  });
  const [lastSynced, setLastSynced] = useState<Record<string, Date | null>>({
    documents: null,
    exigences: null,
    membres: null,
    bibliotheque: null,
    'test_table': null,
    'collaboration': null,
    'collaboration_groups': null
  });
  const [syncErrors, setSyncErrors] = useState<Record<string, string | null>>({
    documents: null,
    exigences: null,
    membres: null,
    bibliotheque: null,
    'test_table': null,
    'collaboration': null,
    'collaboration_groups': null
  });
  const [isInitialized, setIsInitialized] = useState<Record<string, boolean>>({
    documents: false,
    exigences: false,
    membres: false,
    bibliotheque: false,
    'test_table': false,
    'collaboration': false,
    'collaboration_groups': false
  });

  // Écouteurs pour les événements de connexion
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Démarrer la synchronisation pour une table
  const startSync = useCallback((tableName: string): void => {
    setIsSyncing(prev => ({ ...prev, [tableName]: true }));
  }, []);

  // Terminer la synchronisation pour une table
  const endSync = useCallback((tableName: string, error?: string | null): void => {
    setIsSyncing(prev => ({ ...prev, [tableName]: false }));
    if (!error) {
      setLastSynced(prev => ({ ...prev, [tableName]: new Date() }));
      setSyncErrors(prev => ({ ...prev, [tableName]: null }));
    } else {
      setSyncErrors(prev => ({ ...prev, [tableName]: error }));
    }
  }, []);

  // Charger les données depuis le serveur
  const loadData = useCallback(async <T,>(tableName: string): Promise<T[]> => {
    if (!isOnline) {
      const localData = localStorage.getItem(`${tableName}_data`);
      if (localData) {
        return JSON.parse(localData) as T[];
      }
      return [];
    }

    startSync(tableName);

    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error("Utilisateur non authentifié");
      }

      const userId = user.id;
      
      // URL de l'API basée sur l'environnement (local, production, etc.)
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const endpoint = `${apiUrl}/${tableName}-load.php`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // Stocker en local pour l'utilisation hors ligne
      localStorage.setItem(`${tableName}_data`, JSON.stringify(data));
      
      // Marquer la table comme initialisée
      setIsInitialized(prev => ({ ...prev, [tableName]: true }));
      
      endSync(tableName);
      return data as T[];
    } catch (error) {
      console.error(`Erreur lors du chargement des données de ${tableName}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      endSync(tableName, errorMessage);
      
      // Utiliser les données en cache en cas d'erreur
      const localData = localStorage.getItem(`${tableName}_data`);
      if (localData) {
        return JSON.parse(localData) as T[];
      }
      
      throw error;
    }
  }, [isOnline, startSync, endSync]);

  // Synchroniser les données avec le serveur
  const syncData = useCallback(async <T,>(tableName: string, data: T[]): Promise<boolean> => {
    // Toujours enregistrer localement, que l'utilisateur soit en ligne ou non
    localStorage.setItem(`${tableName}_data`, JSON.stringify(data));

    // Si hors ligne, retourner vrai mais ne pas synchroniser avec le serveur
    if (!isOnline) {
      return true;
    }

    startSync(tableName);

    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error("Utilisateur non authentifié");
      }

      const userId = user.id;
      
      // URL de l'API basée sur l'environnement
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const endpoint = `${apiUrl}/${tableName}-sync.php`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          data: data
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        endSync(tableName);
        return true;
      } else {
        throw new Error(result.message || "Échec de la synchronisation");
      }
    } catch (error) {
      console.error(`Erreur lors de la synchronisation des données de ${tableName}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      endSync(tableName, errorMessage);
      return false;
    }
  }, [isOnline, startSync, endSync]);

  // Récupérer la dernière date de synchronisation pour une table
  const getLastSynced = useCallback((tableName: string): Date | null => {
    return lastSynced[tableName] || null;
  }, [lastSynced]);

  // Récupérer l'erreur de synchronisation pour une table
  const getSyncError = useCallback((tableName: string): string | null => {
    return syncErrors[tableName] || null;
  }, [syncErrors]);

  // Effacer toutes les erreurs de synchronisation
  const clearSyncErrors = useCallback((): void => {
    setSyncErrors({
      documents: null,
      exigences: null,
      membres: null,
      bibliotheque: null,
      'test_table': null,
      'collaboration': null,
      'collaboration_groups': null
    });
  }, []);

  // Forcer la synchronisation de toutes les tables
  const forceSyncAll = useCallback(async (): Promise<void> => {
    for (const table of Object.keys(isSyncing)) {
      try {
        const localData = localStorage.getItem(`${table}_data`);
        if (localData) {
          const data = JSON.parse(localData);
          await syncData(table, data);
        } else {
          // Si pas de données locales, charger depuis le serveur
          await loadData(table);
        }
      } catch (error) {
        console.error(`Erreur lors de la synchronisation forcée de ${table}:`, error);
      }
    }
  }, [isSyncing, syncData, loadData]);

  const value = {
    isOnline,
    isSyncing,
    lastSynced,
    syncErrors,
    syncData,
    loadData,
    startSync,
    endSync,
    getLastSynced,
    getSyncError,
    isInitialized,
    clearSyncErrors,
    forceSyncAll
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};
