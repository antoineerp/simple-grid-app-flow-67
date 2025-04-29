
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { webSocketService, WebSocketMessageType } from '@/services/sync/webSocketService';
import { indexedDBService } from '@/services/sync/indexedDBService';
import { serviceWorkerManager } from '@/services/sync/serviceWorkerManager';
import { SYNC_CONFIG } from '@/services/sync/syncConfig';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { getCurrentUser } from '@/services/auth/authService';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

interface SyncOptions<T> {
  entityType: string;
  initialData?: T[];
  autoSync?: boolean;
  syncInterval?: number;
  onDataUpdate?: (data: T[]) => void;
}

/**
 * Hook unifié pour la synchronisation des données
 */
export function useSync<T extends { id: string }>({
  entityType,
  initialData = [],
  autoSync = true,
  syncInterval = SYNC_CONFIG.backgroundSyncInterval,
  onDataUpdate
}: SyncOptions<T>) {
  const [data, setData] = useState<T[]>(initialData);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncFailed, setSyncFailed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  
  // Charger les données depuis IndexedDB
  const loadFromIndexedDB = useCallback(async () => {
    try {
      const cachedData = await indexedDBService.loadData<T>(entityType);
      if (cachedData.length > 0) {
        console.log(`${cachedData.length} éléments de type "${entityType}" chargés depuis IndexedDB`);
        setData(cachedData);
        onDataUpdate?.(cachedData);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Erreur lors du chargement des données "${entityType}" depuis IndexedDB:`, error);
      return false;
    }
  }, [entityType, onDataUpdate]);
  
  // Charger les données depuis l'API REST
  const loadFromAPI = useCallback(async (userId: string): Promise<boolean> => {
    if (!isOnline) return false;
    
    setIsSyncing(true);
    try {
      // Trouver l'endpoint correspondant au type d'entité
      const endpoint = SYNC_CONFIG.apiEndpoints[entityType as keyof typeof SYNC_CONFIG.apiEndpoints]?.load;
      if (!endpoint) {
        throw new Error(`Endpoint de chargement non configuré pour "${entityType}"`);
      }
      
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/${endpoint}?userId=${userId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Échec du chargement des données');
      }
      
      // Les API peuvent renvoyer les données sous des noms différents
      const responseData = result[entityType] || 
                        result.data || 
                        result[entityType + 's'] || 
                        result.items ||
                        [];
                        
      if (Array.isArray(responseData)) {
        setData(responseData);
        onDataUpdate?.(responseData);
        
        // Mettre en cache dans IndexedDB
        await indexedDBService.saveData(entityType, responseData);
        
        setLastSynced(new Date());
        setSyncFailed(false);
        return true;
      } else {
        throw new Error('Format de données invalide');
      }
    } catch (error) {
      console.error(`Erreur lors du chargement des données "${entityType}" depuis l'API:`, error);
      setSyncFailed(true);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [entityType, isOnline, onDataUpdate]);
  
  // Synchroniser les données avec le serveur via WebSocket ou API REST
  const syncWithServer = useCallback(async (dataToSync: T[] = data): Promise<boolean> => {
    if (!isOnline || isSyncing) return false;
    
    const userId = getCurrentUser();
    if (!userId) {
      console.error('Impossible de synchroniser: utilisateur non connecté');
      return false;
    }
    
    setIsSyncing(true);
    
    try {
      // D'abord essayer via WebSocket si connecté
      if (webSocketService.isConnected()) {
        const syncSuccess = webSocketService.requestSync(entityType, dataToSync);
        if (syncSuccess) {
          console.log(`Demande de synchronisation "${entityType}" envoyée via WebSocket`);
          // La réponse sera traitée par les écouteurs WebSocket
          return true;
        }
      }
      
      // Fallback à l'API REST
      const endpoint = SYNC_CONFIG.apiEndpoints[entityType as keyof typeof SYNC_CONFIG.apiEndpoints]?.sync;
      if (!endpoint) {
        throw new Error(`Endpoint de synchronisation non configuré pour "${entityType}"`);
      }
      
      const API_URL = getApiUrl();
      const validUserId = typeof userId === 'object' ? 
        (userId.identifiant_technique || userId.email || 'p71x6d_system') : userId;
      
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: validUserId,
          [entityType]: dataToSync
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Échec de la synchronisation');
      }
      
      // Mettre à jour le statut
      setLastSynced(new Date());
      setSyncFailed(false);
      
      // Mettre en cache dans IndexedDB
      await indexedDBService.saveData(entityType, dataToSync);
      
      toast({
        title: 'Synchronisation réussie',
        description: `Les données ont été synchronisées avec le serveur (${dataToSync.length} éléments)`
      });
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la synchronisation "${entityType}":`, error);
      setSyncFailed(true);
      
      toast({
        title: 'Erreur de synchronisation',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive'
      });
      
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [data, entityType, isOnline, isSyncing, toast]);
  
  // Réinitialiser le statut de synchronisation
  const resetSyncStatus = useCallback(() => {
    setSyncFailed(false);
    
    // Recharger les données
    const userId = getCurrentUser();
    if (userId && isOnline) {
      loadFromAPI(typeof userId === 'object' ? 
        (userId.identifiant_technique || userId.email || 'p71x6d_system') : userId);
    }
  }, [loadFromAPI, isOnline]);
  
  // Initialisation et configuration des écouteurs WebSocket
  useEffect(() => {
    const init = async () => {
      // Initialiser IndexedDB
      await indexedDBService.initDatabase();
      
      // Charger d'abord depuis le cache
      const hasCachedData = await loadFromIndexedDB();
      
      // Connecter au WebSocket si en ligne
      const userId = getCurrentUser();
      if (userId && isOnline) {
        const validUserId = typeof userId === 'object' ? 
          (userId.identifiant_technique || userId.email || 'p71x6d_system') : userId;
        
        // Charger depuis l'API si pas de données en cache
        if (!hasCachedData) {
          await loadFromAPI(validUserId);
        }
        
        // Connecter au WebSocket
        webSocketService.connect(validUserId);
        
        // Initialiser le Service Worker
        serviceWorkerManager.register();
      }
      
      setIsInitialized(true);
    };
    
    init();
    
    // Configuration des écouteurs WebSocket
    const handleDataUpdate = (message: any) => {
      if (message.entityType === entityType && Array.isArray(message.data)) {
        console.log(`Mise à jour des données "${entityType}" reçue via WebSocket`);
        setData(message.data);
        onDataUpdate?.(message.data);
        setLastSynced(new Date());
      }
    };
    
    webSocketService.subscribe(
      `${WebSocketMessageType.DATA_UPDATE}:${entityType}`, 
      handleDataUpdate
    );
    
    // Nettoyer lors du démontage
    return () => {
      webSocketService.unsubscribe(
        `${WebSocketMessageType.DATA_UPDATE}:${entityType}`, 
        handleDataUpdate
      );
    };
  }, [entityType, loadFromIndexedDB, loadFromAPI, isOnline, onDataUpdate]);
  
  // Synchronisation périodique si autoSync est activé
  useEffect(() => {
    if (!autoSync || !isInitialized || !isOnline) return;
    
    const syncIntervalId = setInterval(() => {
      if (!isSyncing && isOnline) {
        syncWithServer().catch(console.error);
      }
    }, syncInterval);
    
    return () => clearInterval(syncIntervalId);
  }, [autoSync, isInitialized, isOnline, isSyncing, syncWithServer, syncInterval]);
  
  // Gérer les changements d'état en ligne/hors ligne
  useEffect(() => {
    if (isOnline && isInitialized) {
      // En reconnexion, synchroniser les données
      const userId = getCurrentUser();
      if (userId) {
        const validUserId = typeof userId === 'object' ? 
          (userId.identifiant_technique || userId.email || 'p71x6d_system') : userId;
        
        webSocketService.connect(validUserId);
        
        // Déclencher une synchronisation
        if (data.length > 0) {
          syncWithServer().catch(console.error);
        } else {
          loadFromAPI(validUserId).catch(console.error);
        }
      }
    }
  }, [isOnline, isInitialized, data.length, syncWithServer, loadFromAPI]);
  
  // Écouter les événements de synchronisation en arrière-plan
  useEffect(() => {
    const handleBackgroundSyncComplete = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail.entityType === entityType) {
        setLastSynced(new Date());
        
        // Recharger les données si nécessaire
        const userId = getCurrentUser();
        if (userId && isOnline) {
          loadFromAPI(typeof userId === 'object' ? 
            (userId.identifiant_technique || userId.email || 'p71x6d_system') : userId).catch(console.error);
        }
      }
    };
    
    window.addEventListener('background_sync_complete', handleBackgroundSyncComplete);
    
    return () => {
      window.removeEventListener('background_sync_complete', handleBackgroundSyncComplete);
    };
  }, [entityType, loadFromAPI, isOnline]);
  
  // Mettre à jour IndexedDB quand les données changent
  useEffect(() => {
    if (isInitialized && data.length > 0) {
      indexedDBService.saveData(entityType, data).catch(console.error);
    }
  }, [entityType, data, isInitialized]);
  
  return {
    data,
    setData,
    isSyncing,
    syncFailed,
    lastSynced,
    isOnline,
    isInitialized,
    syncWithServer,
    loadFromAPI,
    resetSyncStatus
  };
}

/**
 * Hook pour gérer la synchronisation globale de l'application
 */
export function useGlobalSync() {
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  const [isGlobalSyncing, setIsGlobalSyncing] = useState(false);
  const [lastGlobalSync, setLastGlobalSync] = useState<Date | null>(null);
  
  // Synchroniser toutes les données
  const syncAllData = useCallback(async (allData: Record<string, any[]> = {}): Promise<boolean> => {
    if (!isOnline || isGlobalSyncing) {
      toast({
        title: isGlobalSyncing ? "Synchronisation en cours" : "Hors ligne",
        description: isGlobalSyncing ?
          "Une synchronisation est déjà en cours" :
          "La synchronisation est impossible en mode hors ligne",
        variant: "destructive"
      });
      return false;
    }
    
    const userId = getCurrentUser();
    if (!userId) {
      toast({
        title: "Non authentifié",
        description: "Vous devez être connecté pour synchroniser vos données",
        variant: "destructive"
      });
      return false;
    }
    
    setIsGlobalSyncing(true);
    
    try {
      const validUserId = typeof userId === 'object' ?
        (userId.identifiant_technique || userId.email || 'p71x6d_system') : userId;
      
      // Connecter au WebSocket si pas déjà connecté
      if (!webSocketService.isConnected()) {
        webSocketService.connect(validUserId);
      }
      
      const syncPromises: Promise<boolean>[] = [];
      
      // Pour chaque type d'entité, synchroniser via l'API REST
      Object.entries(allData).forEach(([entityType, items]) => {
        if (!items || !Array.isArray(items) || items.length === 0) return;
        
        const endpoint = SYNC_CONFIG.apiEndpoints[entityType as keyof typeof SYNC_CONFIG.apiEndpoints]?.sync;
        if (!endpoint) {
          console.warn(`Endpoint de synchronisation non configuré pour "${entityType}"`);
          return;
        }
        
        // Créer une promesse pour chaque synchronisation
        const syncPromise = (async () => {
          try {
            const API_URL = getApiUrl();
            const response = await fetch(`${API_URL}/${endpoint}`, {
              method: 'POST',
              headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                userId: validUserId,
                [entityType]: items
              })
            });
            
            if (!response.ok) {
              throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            if (!result.success) {
              throw new Error(result.message || 'Échec de la synchronisation');
            }
            
            // Mettre en cache dans IndexedDB
            await indexedDBService.saveData(entityType, items);
            
            return true;
          } catch (error) {
            console.error(`Erreur lors de la synchronisation "${entityType}":`, error);
            return false;
          }
        })();
        
        syncPromises.push(syncPromise);
      });
      
      // Attendre que toutes les synchronisations soient terminées
      const results = await Promise.all(syncPromises);
      const allSuccess = results.length > 0 && results.every(result => result === true);
      
      if (allSuccess) {
        setLastGlobalSync(new Date());
        
        toast({
          title: "Synchronisation globale réussie",
          description: "Toutes les données ont été synchronisées avec le serveur",
        });
      } else if (results.some(result => result === true)) {
        setLastGlobalSync(new Date());
        
        toast({
          title: "Synchronisation partielle",
          description: "Certaines données ont été synchronisées avec succès",
          variant: "warning"
        });
      } else {
        toast({
          title: "Échec de synchronisation",
          description: "Aucune données n'a pu être synchronisée",
          variant: "destructive"
        });
      }
      
      return allSuccess;
    } catch (error) {
      console.error("Erreur lors de la synchronisation globale:", error);
      
      toast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive"
      });
      
      return false;
    } finally {
      setIsGlobalSyncing(false);
    }
  }, [isOnline, isGlobalSyncing, toast]);
  
  // Gérer les événements de connectivité réseau
  useEffect(() => {
    const handleOnline = () => {
      console.log("Connexion réseau rétablie");
      
      // Reconnecter au WebSocket
      const userId = getCurrentUser();
      if (userId) {
        const validUserId = typeof userId === 'object' ?
          (userId.identifiant_technique || userId.email || 'p71x6d_system') : userId;
        
        webSocketService.connect(validUserId);
        
        toast({
          title: "Connexion rétablie",
          description: "La connexion réseau a été rétablie"
        });
      }
    };
    
    const handleOffline = () => {
      console.log("Connexion réseau perdue");
      
      toast({
        title: "Mode hors ligne",
        description: "La connexion réseau a été perdue. L'application fonctionne maintenant en mode hors ligne.",
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
  
  return {
    syncAllData,
    isGlobalSyncing,
    lastGlobalSync,
    isOnline,
    webSocketStatus: webSocketService.isConnected() ? 'connected' : 'disconnected',
    serviceWorkerActive: serviceWorkerManager.isActive()
  };
}
