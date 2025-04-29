
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useState } from 'react';

export interface SyncOptions<T> {
  endpoint: string;
  loadEndpoint: string;
  data: T[];
  userId: string | object;
  dataName?: string;
  additionalData?: any; // Ajout du support pour des données supplémentaires
  maxRetries?: number;
  retryDelay?: number;
}

export interface LoadOptions {
  endpoint: string;
  loadEndpoint: string;
  userId: string | object;
  maxRetries?: number;
  retryDelay?: number;
}

export const useSyncService = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  const syncWithServer = async <T>(options: SyncOptions<T>): Promise<boolean> => {
    if (isSyncing) return false;
    
    setIsSyncing(true);
    setSyncFailed(false);
    
    try {
      // Simuler une synchronisation réussie pour l'instant
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`[SyncService] Synchronisation réussie avec ${options.endpoint}`);
      console.log(`[SyncService] Données: `, options.data);
      
      if (options.additionalData) {
        console.log(`[SyncService] Données additionnelles: `, options.additionalData);
      }
      
      setLastSynced(new Date());
      return true;
    } catch (error) {
      console.error(`[SyncService] Erreur de synchronisation avec ${options.endpoint}:`, error);
      setSyncFailed(true);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const loadFromServer = async <T>(options: LoadOptions): Promise<T[]> => {
    if (isSyncing) {
      throw new Error("Une synchronisation est déjà en cours");
    }
    
    setIsSyncing(true);
    setLoadError(null);
    
    try {
      // Simuler un chargement réussi pour l'instant
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`[SyncService] Chargement réussi depuis ${options.loadEndpoint}`);
      
      // Renvoyer un tableau vide pour l'instant
      const result: T[] = [];
      setLastSynced(new Date());
      return result;
    } catch (error) {
      console.error(`[SyncService] Erreur de chargement depuis ${options.loadEndpoint}:`, error);
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      setLoadError(message);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };
  
  const resetSyncStatus = () => {
    setSyncFailed(false);
    setLoadError(null);
  };

  return {
    syncWithServer,
    loadFromServer,
    isSyncing,
    syncFailed,
    lastSynced,
    loadError,
    resetSyncStatus
  };
};
