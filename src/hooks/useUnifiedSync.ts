import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import {
  loadFromCache,
  saveToCache,
  syncWithServer,
  fetchFromServer,
  createItem as createSyncItem,
  updateItem as updateSyncItem,
  deleteItem as deleteSyncItem,
  reorderItems as reorderSyncItems,
  SyncItem
} from '@/services/sync/UnifiedSyncService';

// Types pour les options et résultats
interface UseUnifiedSyncOptions<T extends SyncItem> {
  tableName: string;
  endpoint?: string;
  autoSync?: boolean;
  syncInterval?: number;
  itemFactory?: (data?: Partial<T>) => T;
}

interface UnifiedSyncResult<T extends SyncItem> {
  data: T[];
  setData: React.Dispatch<React.SetStateAction<T[]>>;
  isSyncing: boolean;
  lastSynced: Date | null;
  syncFailed: boolean;
  isOnline: boolean;
  createItem: (data?: Partial<T>) => T;
  updateItem: (id: string, data: Partial<T>) => T | null;
  deleteItem: (id: string) => boolean;
  reorderItems: (startIndex: number, endIndex: number, groupId?: string) => boolean;
  syncData: (type?: 'auto' | 'manual' | 'init') => Promise<boolean>;
}

export function useUnifiedSync<T extends SyncItem>({
  tableName,
  endpoint,
  autoSync = true,
  syncInterval = 60000,
  itemFactory
}: UseUnifiedSyncOptions<T>): UnifiedSyncResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncFailed, setSyncFailed] = useState(false);
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();

  // Charger les données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      console.log(`useUnifiedSync: Chargement initial des données pour ${tableName}`);
      
      // D'abord, charger depuis le cache local
      const cachedData = loadFromCache<T>(tableName);
      if (cachedData && cachedData.length > 0) {
        setData(cachedData);
      }
      
      // Ensuite, essayer de synchroniser avec le serveur si en ligne
      if (isOnline && autoSync) {
        await syncData('init');
      }
    };
    
    loadInitialData();
  }, [tableName]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Configurer la synchronisation automatique
  useEffect(() => {
    if (!autoSync || !isOnline) return;
    
    const intervalId = setInterval(() => {
      syncData('auto').catch(console.error);
    }, syncInterval);
    
    return () => clearInterval(intervalId);
  }, [autoSync, isOnline, syncInterval]); // eslint-disable-line react-hooks/exhaustive-deps

  // Synchroniser les données avec le serveur
  const syncData = useCallback(async (type: 'auto' | 'manual' | 'init' = 'manual'): Promise<boolean> => {
    if (isSyncing) {
      console.log(`useUnifiedSync: Synchronisation déjà en cours pour ${tableName}`);
      return false;
    }
    
    console.log(`useUnifiedSync: Début de synchronisation (${type}) pour ${tableName}`);
    
    setIsSyncing(true);
    setSyncFailed(false);
    
    try {
      if (!isOnline) {
        console.log(`useUnifiedSync: Hors ligne, impossible de synchroniser ${tableName}`);
        setSyncFailed(true);
        
        if (type === 'manual') {
          // Seulement notifier l'utilisateur si c'est une synchro manuelle
          toast({
            title: "Synchronisation impossible",
            description: "Vous êtes hors ligne. Les modifications seront synchronisées automatiquement une fois la connexion rétablie.",
            variant: "destructive"
          });
        }
        return false;
      }
      
      // Fix de l'erreur TS2367: Utiliser les conditions adéquates pour comparer des types string littéraux
      if (type === 'init' || type === 'manual') {
        const serverData = await fetchFromServer<T>(tableName, endpoint);
        if (serverData && serverData.length > 0) {
          setData(serverData);
          setLastSynced(new Date());
        }
      } else if (type === 'auto') {
        // Pour les synchronisations de type 'auto', envoyer les données locales au serveur
        const result = await syncWithServer<T>(tableName, data, endpoint);
        if (result.success) {
          setLastSynced(new Date());
        } else {
          console.error(`useUnifiedSync: Échec de synchronisation pour ${tableName}:`, result.message);
          setSyncFailed(true);
          if (type === 'manual') {
            toast({
              title: "Échec de synchronisation",
              description: result.message,
              variant: "destructive"
            });
          }
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error(`useUnifiedSync: Erreur lors de la synchronisation de ${tableName}:`, error);
      setSyncFailed(true);
      
      if (type === 'manual') {
        toast({
          title: "Erreur de synchronisation",
          description: error instanceof Error ? error.message : "Une erreur inconnue est survenue",
          variant: "destructive"
        });
      }
      
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [data, endpoint, isOnline, isSyncing, tableName, toast]);

  // Création d'un nouvel élément
  const createNewItem = useCallback((itemData: Partial<T> = {}) => {
    if (itemFactory) {
      // Explicit type cast to ensure TypeScript that this is a valid T object
      const newItem = itemFactory(itemData) as T;
      const updatedData = [...data, newItem];
      setData(updatedData);
      saveToCache(tableName, updatedData);
      return newItem;
    } else {
      // Use the generic createItem function
      const newItem = createSyncItem<T>(tableName, itemData);
      setData(prev => [...prev, newItem]);
      return newItem;
    }
  }, [data, itemFactory, tableName]);

  // Mise à jour d'un élément
  const updateExistingItem = useCallback((id: string, itemData: Partial<T>) => {
    const updatedItem = updateSyncItem<T>(tableName, id, itemData);
    if (updatedItem) {
      setData(prev => prev.map(item => item.id === id ? updatedItem : item));
    }
    return updatedItem;
  }, [tableName]);

  // Suppression d'un élément
  const deleteExistingItem = useCallback((id: string) => {
    const success = deleteSyncItem<T>(tableName, id);
    if (success) {
      setData(prev => prev.filter(item => item.id !== id));
    }
    return success;
  }, [tableName]);

  // Réorganisation des éléments
  const reorderExistingItems = useCallback((startIndex: number, endIndex: number, groupId?: string) => {
    const success = reorderSyncItems<T>(tableName, startIndex, endIndex, groupId);
    if (success) {
      // Refresh data from cache after reordering
      setData(loadFromCache<T>(tableName));
    }
    return success;
  }, [tableName]);

  return {
    data,
    setData,
    isSyncing,
    lastSynced,
    syncFailed,
    isOnline,
    createItem: createNewItem,
    updateItem: updateExistingItem,
    deleteItem: deleteExistingItem,
    reorderItems: reorderExistingItems,
    syncData
  };
}
