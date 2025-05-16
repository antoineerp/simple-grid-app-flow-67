
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

export interface SyncContextProps {
  isOnline: boolean;
  isSyncing: Record<string, boolean>;
  lastSynced: Record<string, Date | null>;
  syncErrors: Record<string, string | null>;
  startSync: (tableName: string) => void;
  endSync: (tableName: string, error?: string | null) => void;
  syncData: <T>(tableName: string, data: T[]) => Promise<boolean>;
  loadData: <T>(tableName: string) => Promise<T[]>;
  getSyncError: (tableName: string) => string | null;
  getLastSynced: (tableName: string) => Date | null;
}

const SyncContext = createContext<SyncContextProps | null>(null);

export const useSyncContext = (): SyncContextProps => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext doit être utilisé dans un SyncProvider');
  }
  return context;
};

interface SyncProviderProps {
  children: ReactNode;
  initialSyncInterval?: number;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ 
  children, 
  initialSyncInterval = 10000 
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});
  const [syncErrors, setSyncErrors] = useState<Record<string, string | null>>({});
  const [lastSynced, setLastSynced] = useState<Record<string, Date | null>>({});
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  // Mettre à jour l'état de connexion
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connexion rétablie",
        description: "Vous êtes maintenant connecté à Internet",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Connexion perdue",
        description: "Vous êtes actuellement hors ligne",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Marquer le montage du composant
  useEffect(() => {
    setIsMounted(true);
    console.info("SyncProvider monté");
    return () => {
      setIsMounted(false);
      console.info("SyncProvider démonté");
    };
  }, []);

  // Synchroniser périodiquement
  useEffect(() => {
    console.info("Timer de synchronisation configuré pour", initialSyncInterval / 1000, "secondes");
    const interval = setInterval(() => {
      // Pas de sync automatique pour l'instant, juste pour être sûr de ne pas perturber les données
    }, initialSyncInterval);

    return () => clearInterval(interval);
  }, [initialSyncInterval]);

  const startSync = (tableName: string) => {
    setIsSyncing(prev => ({
      ...prev,
      [tableName]: true
    }));
  };

  const endSync = (tableName: string, error?: string | null) => {
    setIsSyncing(prev => ({
      ...prev,
      [tableName]: false
    }));

    if (error) {
      setSyncErrors(prev => ({
        ...prev,
        [tableName]: error
      }));
    } else {
      setSyncErrors(prev => ({
        ...prev,
        [tableName]: null
      }));
      setLastSynced(prev => ({
        ...prev,
        [tableName]: new Date()
      }));
    }
  };

  const syncData = async <T,>(tableName: string, data: T[]): Promise<boolean> => {
    if (!isOnline) {
      toast({
        title: "Hors ligne",
        description: "Impossible de synchroniser en mode hors ligne",
        variant: "destructive"
      });
      return false;
    }

    startSync(tableName);

    try {
      const currentUser = getCurrentUser();
      
      if (!currentUser || !currentUser.identifiant_technique) {
        throw new Error("Utilisateur non authentifié");
      }

      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/${tableName}-sync.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          userId: currentUser.identifiant_technique,
          [tableName]: data
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || "Échec de synchronisation");
      }

      endSync(tableName);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      endSync(tableName, message);
      
      toast({
        title: "Erreur de synchronisation",
        description: `Impossible de synchroniser ${tableName}: ${message}`,
        variant: "destructive"
      });

      return false;
    }
  };

  const loadData = async <T,>(tableName: string): Promise<T[]> => {
    if (!isOnline) {
      throw new Error("Impossible de charger les données en mode hors ligne");
    }

    startSync(tableName);

    try {
      const currentUser = getCurrentUser();
      
      if (!currentUser || !currentUser.identifiant_technique) {
        throw new Error("Utilisateur non authentifié");
      }

      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/${tableName}-get.php?userId=${encodeURIComponent(currentUser.identifiant_technique)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || "Échec de chargement");
      }

      endSync(tableName);
      return result.data || [];
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      endSync(tableName, message);
      throw error;
    }
  };

  const getSyncError = (tableName: string): string | null => {
    return syncErrors[tableName] || null;
  };

  const getLastSynced = (tableName: string): Date | null => {
    return lastSynced[tableName] || null;
  };

  const value: SyncContextProps = {
    isOnline,
    isSyncing,
    lastSynced,
    syncErrors,
    startSync,
    endSync,
    syncData,
    loadData,
    getSyncError,
    getLastSynced
  };

  console.info("SyncProvider rendu avec état:", {
    isSyncing: Object.values(isSyncing).some(v => v),
    lastSynced: Object.values(lastSynced).find(v => v !== null),
    syncFailed: Object.values(syncErrors).some(v => v !== null)
  }, "Provider monté:", isMounted);

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};
