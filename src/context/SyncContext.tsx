
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getCurrentUser } from '@/services/auth/authService';
import { getApiUrl } from '@/config/apiConfig';
import { useToast } from '@/hooks/use-toast';

interface SyncContextProps {
  isSyncing: boolean;
  lastSynced: Date | null;
  syncFailed: boolean;
  syncAll: () => Promise<boolean>;
  syncData: <T>(tableName: string, data: T[]) => Promise<boolean>;
  loadData: <T>(tableName: string) => Promise<T[]>;
  getLastSynced: (tableName: string) => Date | null;
  getSyncError: (tableName: string) => string | null;
  isInitialized: () => boolean;
  isOnline: boolean;
  setSyncInterval: (seconds: number) => void;
  registerTableForSync: (tableName: string) => void;
}

const SyncContext = createContext<SyncContextProps | undefined>(undefined);

interface SyncTableState {
  data: any[];
  lastSynced: Date | null;
  error: string | null;
  isSyncing: boolean;
}

interface SyncProviderProps {
  children: ReactNode;
  initialSyncInterval?: number;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ 
  children, 
  initialSyncInterval = 10 // Par défaut, synchroniser toutes les 10 secondes
}) => {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncFailed, setSyncFailed] = useState(false);
  const [isProviderMounted, setIsProviderMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncInterval, setSyncIntervalState] = useState(initialSyncInterval);
  const [syncTimer, setSyncTimer] = useState<NodeJS.Timeout | null>(null);
  const [tablesToSync, setTablesToSync] = useState<Set<string>>(new Set());
  
  // État de synchronisation pour chaque table
  const [tableStates, setTableStates] = useState<Record<string, SyncTableState>>({});
  
  // Détecter l'état de la connexion
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
  
  // Initialiser le provider
  useEffect(() => {
    console.log("SyncProvider monté");
    setIsProviderMounted(true);
    
    // Charger l'état depuis localStorage
    try {
      const savedState = localStorage.getItem('syncProviderState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setTableStates(parsedState.tableStates || {});
        setLastSynced(parsedState.lastSynced ? new Date(parsedState.lastSynced) : null);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l'état de synchronisation:", error);
    }
    
    return () => {
      if (syncTimer) {
        clearInterval(syncTimer);
      }
    };
  }, []);
  
  // Log de l'état lors des rendus
  useEffect(() => {
    console.log("SyncProvider rendu avec état:", { 
      isSyncing, 
      lastSynced, 
      syncFailed
    }, "Provider monté:", isProviderMounted);
  });
  
  // Configurer le timer de synchronisation
  useEffect(() => {
    // Nettoyer un timer existant si présent
    if (syncTimer) {
      clearInterval(syncTimer);
      setSyncTimer(null);
    }
    
    if (syncInterval > 0) {
      const timer = setInterval(() => {
        if (isOnline && !isSyncing && tablesToSync.size > 0) {
          syncAllData();
        }
      }, syncInterval * 1000);
      
      setSyncTimer(timer);
      console.log(`Timer de synchronisation configuré pour ${syncInterval} secondes`);
      
      return () => {
        clearInterval(timer);
      };
    }
  }, [syncInterval, isOnline, isSyncing, tablesToSync]);
  
  // Sauvegarder l'état dans localStorage quand il change
  useEffect(() => {
    try {
      if (isProviderMounted) {
        localStorage.setItem('syncProviderState', JSON.stringify({
          tableStates,
          lastSynced: lastSynced?.toISOString(),
          syncFailed
        }));
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'état de synchronisation:", error);
    }
  }, [tableStates, lastSynced, syncFailed, isProviderMounted]);
  
  // Gérer l'enregistrement d'une table pour la synchronisation
  const registerTableForSync = useCallback((tableName: string) => {
    setTablesToSync(prev => {
      const newSet = new Set(prev);
      newSet.add(tableName);
      return newSet;
    });
    
    if (!tableStates[tableName]) {
      setTableStates(prev => ({
        ...prev,
        [tableName]: {
          data: [],
          lastSynced: null,
          error: null,
          isSyncing: false
        }
      }));
    }
  }, [tableStates]);
  
  // Synchroniser toutes les tables enregistrées
  const syncAllData = useCallback(async () => {
    if (isSyncing || !isOnline) return false;
    
    setIsSyncing(true);
    let allSuccess = true;
    
    try {
      for (const tableName of tablesToSync) {
        // Récupérer les données actuelles
        const currentState = tableStates[tableName];
        if (!currentState) continue;
        
        try {
          setTableStates(prev => ({
            ...prev,
            [tableName]: { ...prev[tableName], isSyncing: true }
          }));
          
          await syncTableData(tableName, currentState.data);
        } catch (error) {
          allSuccess = false;
          console.error(`Erreur lors de la synchronisation de ${tableName}:`, error);
          
          setTableStates(prev => ({
            ...prev,
            [tableName]: { 
              ...prev[tableName], 
              error: error instanceof Error ? error.message : "Erreur inconnue",
              isSyncing: false
            }
          }));
        }
      }
      
      const now = new Date();
      setLastSynced(now);
      setSyncFailed(!allSuccess);
      
      return allSuccess;
    } catch (error) {
      console.error("Erreur lors de la synchronisation globale:", error);
      setSyncFailed(true);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOnline, tablesToSync, tableStates]);
  
  // Synchroniser une table spécifique
  const syncTableData = useCallback(async <T,>(tableName: string, data: T[]): Promise<boolean> => {
    if (!isOnline) return false;
    
    try {
      // Récupérer l'utilisateur actuel
      const currentUser = getCurrentUser();
      const userId = currentUser?.identifiant_technique || 'p71x6d_system';
      
      // Obtenir l'URL de l'API
      const apiUrl = getApiUrl();
      const url = `${apiUrl}/${tableName}-sync.php`;
      
      console.log(`Synchronisation de ${tableName} pour ${userId}`);
      
      // Envoyer les données au serveur
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          userId,
          [tableName]: data
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || "Échec de la synchronisation");
      }
      
      // Mettre à jour l'état
      const now = new Date();
      setTableStates(prev => ({
        ...prev,
        [tableName]: {
          ...prev[tableName],
          data,
          lastSynced: now,
          error: null,
          isSyncing: false
        }
      }));
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la synchronisation de ${tableName}:`, error);
      
      setTableStates(prev => ({
        ...prev,
        [tableName]: {
          ...prev[tableName],
          error: error instanceof Error ? error.message : "Erreur inconnue",
          isSyncing: false
        }
      }));
      
      return false;
    }
  }, [isOnline]);
  
  // Charger les données d'une table
  const loadTableData = useCallback(async <T,>(tableName: string): Promise<T[]> => {
    try {
      // Récupérer l'utilisateur actuel
      const currentUser = getCurrentUser();
      const userId = currentUser?.identifiant_technique || 'p71x6d_system';
      
      // Essayer de charger depuis localStorage d'abord
      const localStorageKey = `${tableName}_${userId}`;
      const storedData = localStorage.getItem(localStorageKey);
      let data: T[] = [];
      
      if (storedData) {
        try {
          data = JSON.parse(storedData);
          console.log(`${data.length} éléments chargés depuis le stockage local pour ${tableName}`);
        } catch (e) {
          console.error(`Erreur lors du parsing des données locales pour ${tableName}:`, e);
        }
      }
      
      // Si en ligne, essayer aussi de charger depuis le serveur
      if (isOnline) {
        try {
          const apiUrl = getApiUrl();
          const url = `${apiUrl}/${tableName}-load.php?userId=${encodeURIComponent(userId)}`;
          
          console.log(`Tentative de chargement depuis: ${url}`);
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            
            if (result.success && Array.isArray(result[tableName])) {
              // Mettre à jour les données avec celles du serveur
              data = result[tableName];
              
              // Sauvegarder dans localStorage
              localStorage.setItem(localStorageKey, JSON.stringify(data));
              console.log(`${data.length} éléments sauvegardés localement pour accès hors ligne`);
              
              // Mettre à jour l'état
              const now = new Date();
              setTableStates(prev => ({
                ...prev,
                [tableName]: {
                  ...prev[tableName],
                  data,
                  lastSynced: now,
                  error: null,
                  isSyncing: false
                }
              }));
            }
          }
        } catch (error) {
          console.warn(`Échec du chargement en ligne pour ${tableName}, utilisation des données locales:`, error);
        }
      }
      
      return data;
    } catch (error) {
      console.error(`Erreur lors du chargement des données pour ${tableName}:`, error);
      throw error;
    }
  }, [isOnline]);
  
  // Configuration de l'intervalle de synchronisation
  const setSyncInterval = useCallback((seconds: number) => {
    if (seconds >= 0) {
      setSyncIntervalState(seconds);
      console.log(`Intervalle de synchronisation défini à ${seconds} secondes`);
    }
  }, []);
  
  // Obtenir la dernière synchronisation pour une table
  const getLastSynced = useCallback((tableName: string): Date | null => {
    return tableStates[tableName]?.lastSynced || null;
  }, [tableStates]);
  
  // Obtenir l'erreur de synchronisation pour une table
  const getSyncError = useCallback((tableName: string): string | null => {
    return tableStates[tableName]?.error || null;
  }, [tableStates]);
  
  // Vérifier si le contexte est initialisé
  const isInitialized = useCallback((): boolean => {
    return isProviderMounted;
  }, [isProviderMounted]);
  
  // Exposer les fonctions et l'état via le contexte
  const value: SyncContextProps = {
    isSyncing,
    lastSynced,
    syncFailed,
    syncAll: syncAllData,
    syncData: syncTableData,
    loadData: loadTableData,
    getLastSynced,
    getSyncError,
    isInitialized,
    isOnline,
    setSyncInterval,
    registerTableForSync
  };
  
  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};

// Hook pour utiliser le contexte
export const useSyncContext = () => {
  const context = useContext(SyncContext);
  
  if (context === undefined) {
    throw new Error('useSyncContext doit être utilisé à l\'intérieur d\'un SyncProvider');
  }
  
  return context;
};
