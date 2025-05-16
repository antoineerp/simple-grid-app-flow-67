
import { useEffect, useState } from 'react';
import { useSyncContext } from '@/contexts/SyncContext';
import { getCurrentUser } from '@/services/auth/authService';

export const useSync = (tableName: string) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const syncContext = useSyncContext();
  
  const {
    isOnline,
    isSyncing,
    lastSynced,
    syncErrors,
    isInitialized
  } = syncContext;
  
  const syncStatus = {
    isOnline,
    isSyncing: isSyncing[tableName] || false,
    lastSynced: lastSynced[tableName] || null,
    syncError: syncErrors[tableName] || null,
    isInitialized: isInitialized[tableName] || false
  };
  
  const startSync = () => syncContext.startSync(tableName);
  const endSync = (err?: string | null) => syncContext.endSync(tableName, err);
  
  // Charger les données initiales
  useEffect(() => {
    const initializeData = async () => {
      if (!isInitialized[tableName]) {
        try {
          const user = getCurrentUser();
          if (!user) {
            console.error("Utilisateur non authentifié");
            return;
          }
          
          setLoading(true);
          startSync();
          
          await syncContext.loadData(tableName);
          
          setLoading(false);
          setError(null);
        } catch (err) {
          setLoading(false);
          const message = err instanceof Error ? err.message : "Erreur inconnue";
          setError(message);
          console.error(`Erreur lors de l'initialisation de ${tableName}:`, err);
        }
      }
    };
    
    initializeData();
  }, [tableName, isInitialized, syncContext]);
  
  return {
    syncStatus,
    startSync,
    endSync,
    loading,
    error
  };
};

export default useSync;
