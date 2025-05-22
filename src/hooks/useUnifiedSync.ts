
import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { toast } from '@/components/ui/use-toast';
import { 
  unifiedSyncService, 
  SyncItem, 
  getSyncState, 
  loadFromCache, 
  saveToCache,
  syncWithServer,
  fetchFromServer,
  createItem,
  updateItem,
  deleteItem,
  reorderItems
} from '@/services/sync/UnifiedSyncService';

interface UseUnifiedSyncOptions {
  tableName: string;
  autoSync?: boolean;
  syncInterval?: number;
  endpoint?: string;
  itemFactory?: <T extends SyncItem>(data?: Partial<T>) => T;
  onSyncComplete?: (data: SyncItem[]) => void;
}

/**
 * Hook unifié pour la gestion de la synchronisation des données
 */
export function useUnifiedSync<T extends SyncItem>({
  tableName,
  autoSync = true,
  syncInterval = 60000,
  endpoint,
  itemFactory,
  onSyncComplete
}: UseUnifiedSyncOptions) {
  const [data, setData] = useState<T[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { isOnline } = useNetworkStatus();

  // Charger les données initiales
  useEffect(() => {
    const initialData = loadFromCache<T>(tableName);
    setData(initialData);
    
    const syncState = getSyncState(tableName);
    setLastSynced(syncState.lastSynced || null);
    setSyncFailed(syncState.hasError || false);
    
    // S'abonner aux événements de synchronisation
    const unsubscribe = unifiedSyncService.events.subscribe(tableName, (eventData) => {
      console.log(`useUnifiedSync: Événement reçu pour ${tableName}:`, eventData);
      
      if (eventData.action === 'update' || eventData.action === 'loaded') {
        setData(eventData.data);
      }
      
      if (eventData.action === 'synced') {
        setLastSynced(new Date(eventData.timestamp));
        setSyncFailed(false);
      }
      
      if (eventData.action === 'error') {
        setSyncFailed(true);
      }
    });
    
    // Synchroniser au démarrage si autoSync est activé
    if (autoSync && isOnline) {
      fetchData();
    }
    
    return () => {
      unsubscribe();
    };
  }, [tableName]);

  // Synchronisation automatique
  useEffect(() => {
    if (!autoSync || !isOnline) return;
    
    const intervalId = setInterval(() => {
      syncWithServer<T>(tableName, data, endpoint)
        .catch(error => {
          console.error(`useUnifiedSync: Erreur de synchronisation automatique pour ${tableName}:`, error);
        });
    }, syncInterval);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [autoSync, isOnline, syncInterval, tableName, data, endpoint]);

  // Récupération des données depuis le serveur
  const fetchData = useCallback(async () => {
    setIsSyncing(true);
    
    try {
      const fetchedData = await fetchFromServer<T>(tableName, endpoint);
      setData(fetchedData);
      setLastSynced(new Date());
      setSyncFailed(false);
      
      if (onSyncComplete) {
        onSyncComplete(fetchedData);
      }
      
      return fetchedData;
    } catch (error) {
      console.error(`useUnifiedSync: Erreur lors de la récupération des données pour ${tableName}:`, error);
      setSyncFailed(true);
      return data;
    } finally {
      setIsSyncing(false);
    }
  }, [tableName, endpoint, onSyncComplete, data]);

  // Synchronisation avec le serveur
  const syncData = useCallback(async (trigger: "auto" | "manual" | "initial" = "manual") => {
    if (!isOnline) {
      if (trigger === "manual") {
        toast({
          title: "Synchronisation impossible",
          description: "Vous êtes hors ligne. Les modifications seront synchronisées automatiquement une fois la connexion rétablie.",
          variant: "destructive"
        });
      }
      return false;
    }
    
    setIsSyncing(true);
    
    try {
      const result = await syncWithServer<T>(tableName, data, endpoint);
      
      if (result.success) {
        setLastSynced(new Date());
        setSyncFailed(false);
        
        if (trigger === "manual") {
          toast({
            title: "Synchronisation réussie",
            description: `${result.count || data.length} éléments synchronisés avec succès.`
          });
        }
        
        return true;
      } else {
        setSyncFailed(true);
        
        if (trigger === "manual") {
          toast({
            title: "Échec de la synchronisation",
            description: result.message,
            variant: "destructive"
          });
        }
        
        return false;
      }
    } catch (error) {
      console.error(`useUnifiedSync: Erreur lors de la synchronisation de ${tableName}:`, error);
      setSyncFailed(true);
      
      if (trigger === "manual") {
        toast({
          title: "Erreur de synchronisation",
          description: error instanceof Error ? error.message : "Erreur inconnue",
          variant: "destructive"
        });
      }
      
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [tableName, endpoint, data, isOnline]);

  // Création d'un nouvel élément
  const createNewItem = useCallback((itemData: Partial<T> = {}) => {
    if (itemFactory) {
      const newItem = itemFactory(itemData) as T;
      const updatedData = [...data, newItem];
      setData(updatedData);
      saveToCache(tableName, updatedData);
      return newItem;
    } else {
      const newItem = createItem<T>(tableName, itemData);
      setData([...data, newItem]);
      return newItem;
    }
  }, [tableName, data, itemFactory]);

  // Mise à jour d'un élément
  const updateExistingItem = useCallback((id: string, itemData: Partial<T>) => {
    const updatedItem = updateItem<T>(tableName, id, itemData);
    if (updatedItem) {
      const updatedData = data.map(item => item.id === id ? updatedItem : item);
      setData(updatedData);
    }
    return updatedItem;
  }, [tableName, data]);

  // Suppression d'un élément
  const deleteExistingItem = useCallback((id: string) => {
    const success = deleteItem<T>(tableName, id);
    if (success) {
      const updatedData = data.filter(item => item.id !== id);
      setData(updatedData);
    }
    return success;
  }, [tableName, data]);

  // Réorganisation des éléments
  const reorderExistingItems = useCallback((startIndex: number, endIndex: number, groupId?: string) => {
    const success = reorderItems<T>(tableName, startIndex, endIndex, groupId);
    if (success) {
      // Récupérer les données mises à jour du cache
      const updatedData = loadFromCache<T>(tableName);
      setData(updatedData);
    }
    return success;
  }, [tableName]);

  return {
    data,
    setData: useCallback((newData: T[]) => {
      setData(newData);
      saveToCache(tableName, newData);
    }, [tableName]),
    isSyncing,
    syncFailed,
    lastSynced,
    isOnline,
    fetchData,
    syncData,
    createItem: createNewItem,
    updateItem: updateExistingItem,
    deleteItem: deleteExistingItem,
    reorderItems: reorderExistingItems
  };
}

export default useUnifiedSync;
