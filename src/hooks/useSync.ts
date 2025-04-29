
import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useToast } from '@/hooks/use-toast';

// Configuration pour la synchronisation
export interface SyncConfig {
  endpoint: string;
  loadEndpoint?: string;
  userId: string;
}

// Options pour la synchronisation
export interface SyncOptions {
  forceSync?: boolean;
  delay?: number;
}

// Hook unifié pour la synchronisation de données
export function useSync<T>(entityType: string) {
  const [data, setData] = useState<T[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [webSocketStatus, setWebSocketStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [pendingSyncTimeout, setPendingSyncTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();

  // Réinitialiser l'état de synchronisation
  const resetSyncStatus = useCallback(() => {
    setSyncFailed(false);
  }, []);

  // Fonction pour charger les données depuis le serveur
  const loadFromServer = useCallback(async (config: SyncConfig): Promise<T[]> => {
    const { endpoint, loadEndpoint, userId } = config;
    
    if (!isOnline) {
      console.log(`Hors ligne, impossible de charger les données ${entityType}`);
      return [];
    }
    
    if (!userId) {
      console.warn(`Pas d'utilisateur identifié, impossible de charger les données ${entityType}`);
      return [];
    }
    
    try {
      setIsSyncing(true);
      
      // Utiliser l'endpoint de chargement spécifique s'il existe, sinon utiliser l'endpoint standard
      const apiEndpoint = loadEndpoint || endpoint;
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const apiUrl = `${baseUrl}/api/${apiEndpoint}?userId=${encodeURIComponent(userId)}`;
      
      console.log(`Chargement de ${entityType} depuis ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || `Échec du chargement de ${entityType}`);
      }
      
      if (Array.isArray(result[entityType])) {
        setData(result[entityType]);
        setSyncFailed(false);
        return result[entityType];
      } else if (result.data && Array.isArray(result.data)) {
        setData(result.data);
        setSyncFailed(false);
        return result.data;
      } else {
        console.warn(`Format de données inattendu pour ${entityType}:`, result);
        return [];
      }
    } catch (error) {
      console.error(`Erreur lors du chargement de ${entityType}:`, error);
      setSyncFailed(true);
      toast({
        title: `Erreur de chargement`,
        description: error instanceof Error ? error.message : `Impossible de charger les ${entityType}`,
        variant: "destructive",
      });
      return [];
    } finally {
      setIsSyncing(false);
    }
  }, [entityType, isOnline, toast]);

  // Fonction pour synchroniser les données avec le serveur
  const syncWithServer = useCallback(async (
    data: T[],
    config: SyncConfig,
    options: SyncOptions = {}
  ): Promise<boolean> => {
    const { endpoint, userId } = config;
    const { forceSync = false, delay = 10000 } = options;
    
    if (!isOnline && !forceSync) {
      console.log(`Hors ligne, synchronisation de ${entityType} reportée`);
      return false;
    }
    
    // Annuler tout délai de synchronisation en attente
    if (pendingSyncTimeout) {
      clearTimeout(pendingSyncTimeout);
      setPendingSyncTimeout(null);
    }
    
    // Si nous ne forçons pas la synchronisation, attendre un délai avant de synchroniser
    if (!forceSync) {
      return new Promise((resolve) => {
        const timeout = setTimeout(async () => {
          const result = await performSync(data, endpoint, userId);
          resolve(result);
          setPendingSyncTimeout(null);
        }, delay);
        
        setPendingSyncTimeout(timeout);
      });
    }
    
    // Synchronisation immédiate
    return performSync(data, endpoint, userId);
  }, [entityType, isOnline, pendingSyncTimeout]);

  // Fonction interne pour effectuer la synchronisation
  const performSync = useCallback(async (data: T[], endpoint: string, userId: string): Promise<boolean> => {
    if (!isOnline) {
      return false;
    }
    
    try {
      setIsSyncing(true);
      
      const payload = {
        userId,
        [entityType]: data,
      };
      
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const apiUrl = `${baseUrl}/api/${endpoint}`;
      
      console.log(`Synchronisation de ${entityType} vers ${apiUrl}`, {
        dataCount: data.length,
        userId
      });
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || `Échec de la synchronisation de ${entityType}`);
      }
      
      setLastSynced(new Date());
      setSyncFailed(false);
      return true;
    } catch (error) {
      console.error(`Erreur lors de la synchronisation "${entityType}":`, error);
      setSyncFailed(true);
      toast({
        title: `Erreur de synchronisation`,
        description: error instanceof Error ? error.message : `Impossible de synchroniser les ${entityType}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [entityType, isOnline, toast]);

  return {
    data,
    setData,
    isSyncing,
    syncFailed,
    isOnline,
    lastSynced,
    webSocketStatus,
    resetSyncStatus,
    syncWithServer,
    loadFromServer
  };
}
