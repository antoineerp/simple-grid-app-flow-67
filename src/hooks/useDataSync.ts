
import { useState } from 'react';

// Types nécessaires pour la compatibilité
export interface SyncRecord {
  status: 'idle' | 'syncing' | 'error' | 'success';
  lastSynced: Date | null;
  lastError: string | null;
  pendingChanges: boolean;
}

export interface SyncOptions {
  showToast?: boolean;
}

export interface DataSyncState<T> extends SyncRecord {
  data: T[];
  syncData: (newData?: T[], options?: SyncOptions) => Promise<boolean>;
  loadData: (options?: SyncOptions) => Promise<T[]>;
  saveLocalData: (newData: T[]) => void;
  refreshStatus: () => void;
  isOnline: boolean;
}

// Hook de synchronisation de données simplifié qui ne fait plus de vraies synchronisations
export function useDataSync<T>(tableName: string): DataSyncState<T> {
  const [data, setData] = useState<T[]>([]);
  
  // Rafraîchir le statut - ne fait rien maintenant
  const refreshStatus = () => {
    // Ne fait rien
    console.log(`Statut de synchronisation désactivé pour ${tableName}`);
  };
  
  // Synchroniser les données - ne fait plus rien de réel
  const syncData = async (
    newData?: T[],
    options?: SyncOptions
  ): Promise<boolean> => {
    if (newData) {
      setData(newData);
      localStorage.setItem(`local_data_${tableName}`, JSON.stringify(newData));
    }
    console.log(`Synchronisation désactivée pour ${tableName}`);
    return true;
  };
  
  // Charger les données - charge uniquement depuis localStorage
  const loadData = async (): Promise<T[]> => {
    try {
      const localData = localStorage.getItem(`local_data_${tableName}`);
      if (localData) {
        const parsedData = JSON.parse(localData) as T[];
        setData(parsedData);
        return parsedData;
      }
    } catch (error) {
      console.error(`Erreur lors du chargement local des données pour ${tableName}:`, error);
    }
    return [] as T[];
  };
  
  // Sauvegarder les données localement
  const saveLocalData = (newData: T[]): void => {
    setData(newData);
    localStorage.setItem(`local_data_${tableName}`, JSON.stringify(newData));
  };
  
  return {
    status: 'idle',
    lastSynced: new Date(), // Date factice
    lastError: null,
    pendingChanges: false,
    data,
    syncData,
    loadData,
    saveLocalData,
    refreshStatus,
    isOnline: true
  };
}
