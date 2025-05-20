
import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

export interface SyncOptions {
  showToasts?: boolean;
  silent?: boolean;
  forceRefresh?: boolean;
}

export interface SyncState {
  isSyncing: boolean;
  lastSynced: Date | null;
  syncFailed: boolean;
  dataChanged: boolean;
  pendingSync: boolean;
}

export interface SyncResult<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Hook unifié pour la synchronisation des données avec le serveur
 * Compatible avec toutes les entités de l'application
 */
export const useUnifiedSync = <T extends Array<any>>(entityName: string, initialData: T = [] as unknown as T) => {
  const [data, setData] = useState<T>(initialData);
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSynced: null,
    syncFailed: false,
    dataChanged: false,
    pendingSync: false
  });
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  const syncLocksRef = useRef<Record<string, boolean>>({});
  const operationsQueueRef = useRef<Array<{ entityName: string, data: any[] }>>([]);
  const mountedRef = useRef<boolean>(true);
  const baseApiUrl = getApiUrl();
  const FIXED_USER_ID = getCurrentUser() || 'p71x6d_system';

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Charger les données depuis le stockage local
   */
  const loadFromLocalStorage = useCallback((entity: string = entityName): T => {
    try {
      const storageKey = `${entity}_${FIXED_USER_ID}`;
      const storedData = localStorage.getItem(storageKey);

      if (storedData) {
        return JSON.parse(storedData) as T;
      }
    } catch (error) {
      console.error(`useUnifiedSync: Erreur lors du chargement local de ${entity}:`, error);
    }

    return [] as unknown as T;
  }, [entityName, FIXED_USER_ID]);

  /**
   * Sauvegarder les données dans le stockage local
   */
  const saveToLocalStorage = useCallback((dataToSave: T, entity: string = entityName): void => {
    try {
      const storageKey = `${entity}_${FIXED_USER_ID}`;
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error(`useUnifiedSync: Erreur lors de la sauvegarde locale de ${entity}:`, error);
    }
  }, [entityName, FIXED_USER_ID]);

  /**
   * Acquérir un verrou pour éviter les synchronisations simultanées
   */
  const acquireSyncLock = useCallback((entity: string = entityName): boolean => {
    if (syncLocksRef.current[entity]) {
      return false;
    }
    
    syncLocksRef.current[entity] = true;
    return true;
  }, [entityName]);

  /**
   * Libérer un verrou de synchronisation
   */
  const releaseSyncLock = useCallback((entity: string = entityName): void => {
    syncLocksRef.current[entity] = false;
  }, [entityName]);

  /**
   * Charger les données depuis le serveur
   */
  const loadFromServer = useCallback(async (options: SyncOptions = {}): Promise<SyncResult<T>> => {
    if (!isOnline) {
      console.log(`useUnifiedSync: Mode hors ligne, chargement impossible pour ${entityName}`);
      
      if (!options.silent) {
        toast({
          title: "Mode hors ligne",
          description: `Impossible de charger les données de ${entityName} depuis le serveur`,
          variant: "destructive"
        });
      }
      
      return { success: false, message: "Mode hors ligne" };
    }
    
    if (!acquireSyncLock()) {
      console.log(`useUnifiedSync: Synchronisation déjà en cours pour ${entityName}`);
      return { success: false, message: "Synchronisation déjà en cours" };
    }
    
    setSyncState(prev => ({ ...prev, isSyncing: true }));
    
    try {
      console.log(`useUnifiedSync: Chargement des données de ${entityName} depuis le serveur`);
      
      // Construire l'URL en fonction de l'entité
      const url = `${baseApiUrl}/${entityName}-load.php?userId=${FIXED_USER_ID}`;
      console.log(`useUnifiedSync: URL de chargement: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`useUnifiedSync: Erreur HTTP ${response.status} pour ${entityName}: ${errorText}`);
        throw new Error(`Erreur réseau: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`useUnifiedSync: Données de ${entityName} chargées avec succès:`, result);
        
        // Mise à jour des données locales
        const loadedData = result[entityName] || result.data || [];
        
        if (mountedRef.current) {
          setData(loadedData);
          saveToLocalStorage(loadedData);
          
          setSyncState(prev => ({
            ...prev,
            isSyncing: false,
            lastSynced: new Date(),
            syncFailed: false,
            pendingSync: false
          }));
        }
        
        return { 
          success: true, 
          message: `Données de ${entityName} chargées avec succès`, 
          data: loadedData as T
        };
      } else {
        throw new Error(result.message || `Échec du chargement des données de ${entityName}`);
      }
    } catch (error) {
      console.error(`useUnifiedSync: Erreur lors du chargement de ${entityName}:`, error);
      
      if (mountedRef.current) {
        setSyncState(prev => ({
          ...prev,
          isSyncing: false,
          syncFailed: true
        }));
        
        if (!options.silent) {
          toast({
            title: "Erreur de chargement",
            description: error instanceof Error ? error.message : `Impossible de charger les données de ${entityName}`,
            variant: "destructive"
          });
        }
      }
      
      return { 
        success: false, 
        message: error instanceof Error ? error.message : `Erreur lors du chargement de ${entityName}`
      };
    } finally {
      releaseSyncLock();
    }
  }, [entityName, isOnline, baseApiUrl, FIXED_USER_ID, acquireSyncLock, releaseSyncLock, saveToLocalStorage, toast]);

  /**
   * Synchroniser les données avec le serveur
   */
  const syncWithServer = useCallback(async (dataToSync: T, options: SyncOptions = {}): Promise<SyncResult> => {
    // Toujours sauvegarder localement pour éviter les pertes de données
    saveToLocalStorage(dataToSync);
    
    if (!isOnline) {
      console.log(`useUnifiedSync: Mode hors ligne, synchronisation impossible pour ${entityName}`);
      
      if (!options.silent) {
        toast({
          title: "Mode hors ligne",
          description: `Les données de ${entityName} sont sauvegardées localement`,
          variant: "warning"
        });
      }
      
      // Ajouter à la file d'attente pour synchronisation ultérieure
      operationsQueueRef.current.push({ entityName, data: dataToSync });
      
      setSyncState(prev => ({
        ...prev,
        pendingSync: true,
        dataChanged: true
      }));
      
      return { success: false, message: "Mode hors ligne, données sauvegardées localement" };
    }
    
    if (!acquireSyncLock()) {
      console.log(`useUnifiedSync: Synchronisation déjà en cours pour ${entityName}`);
      return { success: false, message: "Synchronisation déjà en cours" };
    }
    
    setSyncState(prev => ({ ...prev, isSyncing: true }));
    
    try {
      console.log(`useUnifiedSync: Synchronisation des données de ${entityName} avec le serveur`);
      
      // Construire l'URL en fonction de l'entité
      const url = `${baseApiUrl}/${entityName}-sync.php`;
      console.log(`useUnifiedSync: URL de synchronisation: ${url}`);
      
      // Préparer les données à envoyer
      const payload = {
        userId: FIXED_USER_ID,
        [entityName]: dataToSync
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`useUnifiedSync: Erreur HTTP ${response.status} pour ${entityName}: ${errorText}`);
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`useUnifiedSync: Données de ${entityName} synchronisées avec succès`);
        
        if (mountedRef.current) {
          // Mise à jour de l'état
          setSyncState(prev => ({
            ...prev,
            isSyncing: false,
            lastSynced: new Date(),
            syncFailed: false,
            pendingSync: false,
            dataChanged: false
          }));
          
          if (!options.silent && options.showToasts) {
            toast({
              title: "Synchronisation réussie",
              description: `Les données de ${entityName} ont été synchronisées avec succès`,
            });
          }
        }
        
        return { success: true, message: `Données de ${entityName} synchronisées avec succès` };
      } else {
        throw new Error(result.message || `Échec de la synchronisation des données de ${entityName}`);
      }
    } catch (error) {
      console.error(`useUnifiedSync: Erreur lors de la synchronisation de ${entityName}:`, error);
      
      if (mountedRef.current) {
        setSyncState(prev => ({
          ...prev,
          isSyncing: false,
          syncFailed: true,
          pendingSync: true
        }));
        
        if (!options.silent) {
          toast({
            title: "Erreur de synchronisation",
            description: error instanceof Error ? error.message : `Impossible de synchroniser les données de ${entityName}`,
            variant: "destructive"
          });
        }
      }
      
      return { 
        success: false, 
        message: error instanceof Error ? error.message : `Erreur lors de la synchronisation de ${entityName}`
      };
    } finally {
      releaseSyncLock();
    }
  }, [entityName, isOnline, baseApiUrl, FIXED_USER_ID, acquireSyncLock, releaseSyncLock, saveToLocalStorage, toast]);

  /**
   * Initialiser les données locales et tenter de les synchroniser avec le serveur
   */
  useEffect(() => {
    const initializeData = async () => {
      console.log(`useUnifiedSync: Initialisation des données pour ${entityName}`);
      
      // Charger d'abord depuis le stockage local
      const localData = loadFromLocalStorage();
      if (localData.length > 0) {
        console.log(`useUnifiedSync: Données locales trouvées pour ${entityName}:`, localData.length);
        setData(localData);
      }
      
      // Puis essayer de charger depuis le serveur si en ligne
      if (isOnline) {
        const serverResult = await loadFromServer({ silent: true });
        if (serverResult.success && serverResult.data) {
          console.log(`useUnifiedSync: Données serveur chargées pour ${entityName}:`, serverResult.data.length);
        }
      }
    };
    
    initializeData();
  }, [entityName, isOnline, loadFromLocalStorage, loadFromServer]);

  /**
   * Tenter de synchroniser les données en attente lorsque la connexion est rétablie
   */
  useEffect(() => {
    if (isOnline && syncState.pendingSync && !syncState.isSyncing) {
      console.log(`useUnifiedSync: Tentative de synchronisation des données en attente pour ${entityName}`);
      
      const syncPendingData = setTimeout(() => {
        syncWithServer(data).catch(error => {
          console.error(`useUnifiedSync: Erreur lors de la synchronisation différée:`, error);
        });
      }, 2000);
      
      return () => clearTimeout(syncPendingData);
    }
  }, [isOnline, syncState.pendingSync, syncState.isSyncing, data, entityName, syncWithServer]);

  /**
   * Traiter la file d'attente des opérations en attente
   */
  const processQueue = useCallback(async () => {
    if (!isOnline || operationsQueueRef.current.length === 0) {
      return;
    }
    
    console.log(`useUnifiedSync: Traitement de la file d'attente (${operationsQueueRef.current.length} opérations)`);
    
    const operations = [...operationsQueueRef.current];
    operationsQueueRef.current = [];
    
    for (const operation of operations) {
      try {
        const { entityName: entity, data: entityData } = operation;
        await syncWithServer(entityData as T, { silent: true, entityName: entity });
      } catch (error) {
        console.error(`useUnifiedSync: Erreur lors du traitement de la file d'attente:`, error);
        // Remettre l'opération dans la file si elle échoue
        operationsQueueRef.current.push(operation);
      }
    }
  }, [isOnline, syncWithServer]);

  /**
   * Déclencher le traitement de la file d'attente lorsque la connexion est rétablie
   */
  useEffect(() => {
    if (isOnline && operationsQueueRef.current.length > 0) {
      const queueTimeout = setTimeout(() => {
        processQueue().catch(error => {
          console.error(`useUnifiedSync: Erreur lors du traitement de la file:`, error);
        });
      }, 3000);
      
      return () => clearTimeout(queueTimeout);
    }
  }, [isOnline, processQueue]);

  return {
    data,
    setData,
    syncState: {
      isSyncing: syncState.isSyncing,
      lastSynced: syncState.lastSynced,
      syncFailed: syncState.syncFailed,
      pendingSync: syncState.pendingSync,
      dataChanged: syncState.dataChanged
    },
    isOnline,
    loadFromServer,
    syncWithServer,
    loadFromLocalStorage,
    saveToLocalStorage,
    processQueue
  };
};
