
import { useEffect, useState } from 'react';
import { useSyncContext } from '@/contexts/SyncContext';
import { getCurrentUser } from '@/services/auth/authService';

export const useSync = (tableName: string) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackSyncState, setFallbackSyncState] = useState({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSynced: null,
    syncError: null,
    isInitialized: false
  });
  
  // Try to get the sync context, but provide a fallback if it's not available
  let syncContext;
  try {
    syncContext = useSyncContext();
  } catch (err) {
    console.warn(`SyncContext not available for ${tableName}, using fallback state`);
    // Continue with the fallback state
  }
  
  const {
    isOnline = fallbackSyncState.isOnline,
    isSyncing = {},
    lastSynced = {},
    syncErrors = {},
    isInitialized = {}
  } = syncContext || {};
  
  const syncStatus = {
    isOnline,
    isSyncing: isSyncing[tableName] || fallbackSyncState.isSyncing,
    lastSynced: lastSynced[tableName] || fallbackSyncState.lastSynced,
    syncError: syncErrors[tableName] || fallbackSyncState.syncError,
    isInitialized: isInitialized[tableName] || fallbackSyncState.isInitialized
  };
  
  // Create no-op functions if context is not available
  const startSync = syncContext 
    ? () => syncContext.startSync(tableName)
    : () => { console.warn('SyncContext not available, cannot start sync'); };
    
  const endSync = syncContext 
    ? (err?: string | null) => syncContext.endSync(tableName, err)
    : (err?: string | null) => { 
        console.warn('SyncContext not available, cannot end sync'); 
        if (err) setError(err);
      };
  
  // Charger les données initiales
  useEffect(() => {
    const initializeData = async () => {
      if (!syncContext) {
        console.warn(`SyncContext not available for ${tableName}, skipping initialization`);
        setLoading(false);
        return;
      }
      
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
  
  // Update online status in the fallback state
  useEffect(() => {
    const handleOnline = () => setFallbackSyncState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setFallbackSyncState(prev => ({ ...prev, isOnline: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return {
    syncStatus,
    startSync,
    endSync,
    loading,
    error
  };
};

export default useSync;
