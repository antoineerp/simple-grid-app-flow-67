
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
  
  // Track last sync time to prevent excessive syncing
  const [lastSyncAttemptTime, setLastSyncAttemptTime] = useState<Record<string, number>>({});

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

  // Démarrer la synchronisation pour une table, avec protection contre les boucles
  const startSync = useCallback((tableName: string): void => {
    const now = Date.now();
    const lastAttempt = lastSyncAttemptTime[tableName] || 0;
    
    // Minimum 5 seconds between sync attempts for the same table
    if (now - lastAttempt < 5000) {
      console.log(`Sync throttled for ${tableName}, last attempt ${(now - lastAttempt)/1000}s ago`);
      return;
    }
    
    setLastSyncAttemptTime(prev => ({ ...prev, [tableName]: now }));
    setIsSyncing(prev => ({ ...prev, [tableName]: true }));
  }, [lastSyncAttemptTime]);

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

    // Throttle check - prevent excessive API calls
    const now = Date.now();
    const lastAttempt = lastSyncAttemptTime[tableName] || 0;
    if (now - lastAttempt < 5000) {
      console.log(`Load throttled for ${tableName}, using cached data`);
      const localData = localStorage.getItem(`${tableName}_data`);
      if (localData) {
        return JSON.parse(localData) as T[];
      }
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

      // Utiliser GET au lieu de POST
      const response = await fetch(`${endpoint}?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
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
  }, [isOnline, startSync, endSync, lastSyncAttemptTime]);

  // Synchroniser les données avec le serveur
  const syncData = useCallback(async <T,>(tableName: string, data: T[]): Promise<boolean> => {
    // Toujours enregistrer localement, que l'utilisateur soit en ligne ou non
    localStorage.setItem(`${tableName}_data`, JSON.stringify(data));

    // Si hors ligne, retourner vrai mais ne pas synchroniser avec le serveur
    if (!isOnline) {
      return true;
    }
    
    // Throttle syncing to prevent excessive API calls
    const now = Date.now();
    const lastAttempt = lastSyncAttemptTime[tableName] || 0;
    if (now - lastAttempt < 10000) { // 10 seconds minimum between syncs
      console.log(`Sync throttled for ${tableName}, last attempt ${(now - lastAttempt)/1000}s ago`);
      return true; // Return success but don't actually sync
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
  }, [isOnline, startSync, endSync, lastSyncAttemptTime]);

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

  // Configurer un minuteur pour synchroniser périodiquement toutes les 10 secondes
  useEffect(() => {
    // Only sync if online
    if (!isOnline) return;
    
    const syncTimer = setInterval(() => {
      // Check if any tables need syncing
      Object.keys(isSyncing).forEach(table => {
        const localData = localStorage.getItem(`${table}_data`);
        if (localData) {
          try {
            const data = JSON.parse(localData);
            syncData(table, data).catch(console.error);
          } catch (error) {
            console.error(`Erreur lors de la synchronisation périodique de ${table}:`, error);
          }
        }
      });
    }, 10000); // Sync every 10 seconds
    
    return () => clearInterval(syncTimer);
  }, [isOnline, isSyncing, syncData]);

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
