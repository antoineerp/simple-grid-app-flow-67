
import { useState, useEffect, useCallback, useRef } from 'react';
import { getApiUrl } from '@/config/apiConfig';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/auth/authService';

interface SyncResult<T> {
  success: boolean;
  message: string;
  data?: T;
  details?: any;
}

interface SyncOptions {
  showToast?: boolean;
  silent?: boolean;
  forceRefresh?: boolean;
  skipLocalStorage?: boolean;
}

export const useUnifiedSync = <T>(entityName: string, defaultData: T) => {
  const [data, setData] = useState<T>(defaultData);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncFailed, setSyncFailed] = useState<boolean>(false);
  const [pendingSync, setPendingSync] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [loadAttempts, setLoadAttempts] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  
  const getUserStorageKey = useCallback((userId?: string) => {
    const user = userId || getCurrentUser() || 'default';
    return `${entityName}_${user}`;
  }, [entityName]);

  const getPendingSyncKey = useCallback(() => {
    return `sync_pending_${entityName}`;
  }, [entityName]);

  const loadFromLocalStorage = useCallback((userId?: string): T => {
    try {
      const key = getUserStorageKey(userId);
      const storedData = localStorage.getItem(key);
      
      if (storedData) {
        // Analyser les données stockées
        const parsed = JSON.parse(storedData);
        console.log(`useUnifiedSync(${entityName}): Données chargées depuis le stockage local`, parsed);
        return parsed;
      }
    } catch (err) {
      console.error(`useUnifiedSync(${entityName}): Erreur lors du chargement depuis le stockage local`, err);
    }
    
    return defaultData;
  }, [defaultData, entityName, getUserStorageKey]);

  const saveToLocalStorage = useCallback((newData: T, userId?: string): void => {
    try {
      const key = getUserStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(newData));
      console.log(`useUnifiedSync(${entityName}): Données sauvegardées dans le stockage local`, newData);
    } catch (err) {
      console.error(`useUnifiedSync(${entityName}): Erreur lors de la sauvegarde dans le stockage local`, err);
    }
  }, [entityName, getUserStorageKey]);

  const markPendingSync = useCallback((isPending: boolean = true): void => {
    try {
      const key = getPendingSyncKey();
      if (isPending) {
        localStorage.setItem(key, 'true');
        setPendingSync(true);
        console.log(`useUnifiedSync(${entityName}): Marqué comme en attente de synchronisation`);
      } else {
        localStorage.removeItem(key);
        setPendingSync(false);
        console.log(`useUnifiedSync(${entityName}): Marqueur de synchronisation effacé`);
      }
    } catch (err) {
      console.error(`useUnifiedSync(${entityName}): Erreur lors de la manipulation du marqueur de synchronisation`, err);
    }
  }, [entityName, getPendingSyncKey]);

  const checkPendingSync = useCallback((): boolean => {
    try {
      const key = getPendingSyncKey();
      const isPending = localStorage.getItem(key) === 'true';
      setPendingSync(isPending);
      return isPending;
    } catch (err) {
      console.error(`useUnifiedSync(${entityName}): Erreur lors de la vérification du marqueur de synchronisation`, err);
      return false;
    }
  }, [entityName, getPendingSyncKey]);

  const loadFromServer = useCallback(async (options: SyncOptions = {}): Promise<SyncResult<T>> => {
    const { showToast = true, silent = false, forceRefresh = false } = options;
    
    if (!isOnline) {
      if (!silent) {
        console.log(`useUnifiedSync(${entityName}): Mode hors ligne, utilisation des données locales`);
      }
      return { success: false, message: "Mode hors ligne, utilisation des données locales" };
    }
    
    if (isSyncing && !forceRefresh) {
      if (!silent) {
        console.log(`useUnifiedSync(${entityName}): Synchronisation déjà en cours`);
      }
      return { success: false, message: "Synchronisation déjà en cours" };
    }
    
    try {
      if (!silent) {
        setIsSyncing(true);
        setError(null);
      }
      
      // Annuler toute requête en cours
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Créer un nouveau contrôleur pour cette requête
      abortControllerRef.current = new AbortController();
      
      // Construire l'endpoint en fonction de l'entité
      const endpoint = `${getApiUrl()}/${entityName.toLowerCase()}-load.php`;
      
      const userId = getCurrentUser();
      if (!userId) {
        throw new Error("Utilisateur non connecté");
      }
      
      // Exécuter la requête fetch
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
        }),
        signal: abortControllerRef.current.signal,
      });
      
      // Vérifier si la requête a réussi
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Analyser la réponse JSON
      const result = await response.json();
      
      if (result.success) {
        if (!silent) {
          const receivedData = result.data || defaultData;
          console.log(`useUnifiedSync(${entityName}): Données reçues du serveur`, receivedData);
          
          // Mettre à jour l'état
          setData(receivedData);
          setLastSynced(new Date());
          setSyncFailed(false);
          
          // Sauvegarder en local
          saveToLocalStorage(receivedData);
          
          // Marquer comme synchronisé
          markPendingSync(false);
        }
        
        return { success: true, message: "Données chargées avec succès", data: result.data };
      } else {
        throw new Error(result.message || "Erreur lors du chargement des données");
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log(`useUnifiedSync(${entityName}): Requête annulée`);
        return { success: false, message: "Requête annulée" };
      }
      
      if (!silent) {
        console.error(`useUnifiedSync(${entityName}): Erreur lors du chargement depuis le serveur`, err);
        setError(err);
        setSyncFailed(true);
        
        if (showToast) {
          toast({
            title: "Erreur de synchronisation",
            description: err.message || "Impossible de synchroniser les données avec le serveur",
            variant: "destructive",
          });
        }
      }
      
      return { 
        success: false, 
        message: err.message || "Erreur lors du chargement des données",
        details: { error: err.toString() }
      };
    } finally {
      if (!silent) {
        setIsSyncing(false);
      }
    }
  }, [defaultData, entityName, isOnline, isSyncing, markPendingSync, saveToLocalStorage, toast]);

  const syncWithServer = useCallback(async (dataToSync?: T, options: SyncOptions = {}): Promise<SyncResult<boolean>> => {
    const { showToast = true, silent = false } = options;
    
    if (!isOnline) {
      if (dataToSync) {
        saveToLocalStorage(dataToSync);
        markPendingSync(true);
        
        if (showToast) {
          toast({
            title: "Mode hors ligne",
            description: "Les modifications seront synchronisées lorsque la connexion sera rétablie",
          });
        }
      }
      
      return { 
        success: false, 
        message: "Mode hors ligne, les données seront synchronisées plus tard" 
      };
    }
    
    if (isSyncing) {
      return { success: false, message: "Synchronisation déjà en cours" };
    }
    
    try {
      if (!silent) {
        setIsSyncing(true);
        setError(null);
      }
      
      // Si aucune donnée n'est fournie, utiliser les données actuelles
      const dataToPush = dataToSync || data;
      
      // Construire l'endpoint en fonction de l'entité
      const endpoint = `${getApiUrl()}/${entityName.toLowerCase()}-sync.php`;
      
      const userId = getCurrentUser();
      if (!userId) {
        throw new Error("Utilisateur non connecté");
      }
      
      // Exécuter la requête fetch
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          data: dataToPush,
        }),
      });
      
      // Vérifier si la requête a réussi
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Analyser la réponse JSON
      const result = await response.json();
      
      if (result.success) {
        // Si des données ont été fournies, mettre à jour l'état local
        if (dataToSync) {
          setData(dataToSync);
          saveToLocalStorage(dataToSync);
        }
        
        if (!silent) {
          setLastSynced(new Date());
          setSyncFailed(false);
          
          // Marquer comme synchronisé
          markPendingSync(false);
          
          if (showToast) {
            toast({
              title: "Synchronisation réussie",
              description: "Les données ont été synchronisées avec succès",
            });
          }
        }
        
        return { success: true, message: "Données synchronisées avec succès" };
      } else {
        throw new Error(result.message || "Erreur lors de la synchronisation des données");
      }
    } catch (err: any) {
      if (!silent) {
        console.error(`useUnifiedSync(${entityName}): Erreur lors de la synchronisation avec le serveur`, err);
        setError(err);
        setSyncFailed(true);
        
        if (showToast) {
          toast({
            title: "Erreur de synchronisation",
            description: err.message || "Impossible de synchroniser les données avec le serveur",
            variant: "destructive",
          });
        }
      }
      
      // Si des données ont été fournies, les sauvegarder localement malgré l'erreur
      if (dataToSync) {
        saveToLocalStorage(dataToSync);
        markPendingSync(true);
      }
      
      return { 
        success: false, 
        message: err.message || "Erreur lors de la synchronisation des données",
        details: { error: err.toString() }
      };
    } finally {
      if (!silent) {
        setIsSyncing(false);
      }
    }
  }, [data, entityName, isOnline, isSyncing, markPendingSync, saveToLocalStorage, toast]);

  // Fonction d'API pour mettre à jour les données
  const setDataAndSync = useCallback(async (newData: T, options: SyncOptions = {}): Promise<void> => {
    // Mettre à jour l'état local
    setData(newData);
    
    // Sauvegarder dans le stockage local
    saveToLocalStorage(newData);
    
    // Si en ligne, synchroniser avec le serveur
    if (isOnline) {
      await syncWithServer(newData, options);
    } else {
      // Marquer comme ayant besoin de synchronisation
      markPendingSync(true);
      
      if (options.showToast !== false) {
        toast({
          title: "Sauvegarde locale",
          description: "Les modifications seront synchronisées lorsque la connexion sera rétablie",
        });
      }
    }
  }, [isOnline, markPendingSync, saveToLocalStorage, syncWithServer, toast]);

  // Tentatives de chargement des données
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Charger depuis le stockage local
        const localData = loadFromLocalStorage();
        
        // Utiliser les données locales si disponibles
        if (localData !== defaultData) {
          setData(localData);
          console.log(`useUnifiedSync(${entityName}): Utilisation des données locales`, localData);
        }
        
        // Vérifier s'il y a des synchronisations en attente
        const hasPendingSync = checkPendingSync();
        
        // Si en ligne, essayer de charger depuis le serveur
        if (isOnline) {
          if (hasPendingSync) {
            // Synchroniser les données locales avec le serveur
            await syncWithServer(localData, { silent: true });
          } else {
            // Charger les données depuis le serveur
            await loadFromServer({ silent: true });
          }
        }
      } catch (err) {
        console.error(`useUnifiedSync(${entityName}): Erreur lors de l'initialisation`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };
    
    initializeData();
  }, [checkPendingSync, defaultData, entityName, isOnline, loadFromLocalStorage, loadFromServer, syncWithServer]);

  // Synchronisation automatique lorsque la connexion est rétablie
  useEffect(() => {
    if (isOnline && checkPendingSync()) {
      console.log(`useUnifiedSync(${entityName}): Connexion rétablie, synchronisation des données en attente`);
      syncWithServer(data, { silent: true });
    }
  }, [checkPendingSync, data, entityName, isOnline, syncWithServer]);

  return {
    data,
    setData: setDataAndSync,
    loadFromLocalStorage,
    loadFromServer,
    syncWithServer,
    syncState: {
      isSyncing,
      lastSynced,
      syncFailed,
      pendingSync,
      error,
      loadAttempts,
      setLoadAttempts
    },
    isOnline
  };
};

export default useUnifiedSync;
