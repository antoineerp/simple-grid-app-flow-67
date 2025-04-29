
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { useToast } from './use-toast';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

// Délai minimal entre deux synchronisations (en ms)
const SYNC_DELAY = 10000; // 10 secondes

// Types pour la synchronisation
type SyncStatus = {
  isSyncing: boolean;
  syncFailed: boolean;
  lastSynced: Date | null;
};

export type SyncConfig = {
  endpoint: string;
  loadEndpoint?: string;
  userId: string;
  maxRetries?: number;
  retryDelay?: number;
};

export type SyncOptions = {
  silent?: boolean; // Ne pas afficher de toast
  force?: boolean;  // Forcer la synchronisation même si le délai n'est pas écoulé
};

/**
 * Hook principal pour la synchronisation des données
 */
export const useSync = <T>(entityType: string) => {
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    syncFailed: false,
    lastSynced: null
  });
  
  const [data, setData] = useState<T[] | null>(null);
  
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  const lastSyncTime = useRef<number>(0);
  
  // Référence pour stocker les données en attente de synchronisation
  const pendingData = useRef<T[]>([]);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Réinitialiser le statut de synchronisation
  const resetSyncStatus = useCallback(() => {
    setStatus({
      isSyncing: false,
      syncFailed: false,
      lastSynced: null
    });
  }, []);
  
  // Charger les données depuis le serveur
  const loadFromServer = useCallback(async (config: SyncConfig): Promise<T[]> => {
    if (!isOnline) {
      console.log(`[${entityType}] Mode hors ligne, chargement depuis le serveur impossible`);
      throw new Error('Impossible de charger les données en mode hors ligne');
    }
    
    if (status.isSyncing) {
      console.log(`[${entityType}] Synchronisation déjà en cours, chargement annulé`);
      throw new Error('Synchronisation déjà en cours');
    }
    
    setStatus(prev => ({ ...prev, isSyncing: true }));
    
    const { endpoint, loadEndpoint = endpoint, userId, maxRetries = 1, retryDelay = 1000 } = config;
    
    let attempt = 0;
    
    while (attempt <= maxRetries) {
      try {
        const API_URL = getApiUrl();
        const url = `${API_URL}/${loadEndpoint}?userId=${encodeURIComponent(userId)}`;
        
        console.log(`[${entityType}] Tentative ${attempt + 1}/${maxRetries + 1} de chargement depuis ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success && !Array.isArray(result)) {
          throw new Error(result.message || `Échec du chargement des ${entityType}`);
        }
        
        const responseData = Array.isArray(result) ? result : (result[entityType] || result.data || []);
        
        setStatus({
          isSyncing: false,
          syncFailed: false,
          lastSynced: new Date()
        });
        
        console.log(`[${entityType}] ${responseData.length} éléments chargés avec succès`);
        lastSyncTime.current = Date.now();
        
        // Stocker les données dans le state
        setData(responseData as T[]);
        
        return responseData as T[];
      } catch (error) {
        console.error(`[${entityType}] Erreur de chargement (tentative ${attempt + 1}/${maxRetries + 1}):`, error);
        
        if (attempt === maxRetries) {
          setStatus({
            isSyncing: false,
            syncFailed: true,
            lastSynced: null
          });
          throw error;
        }
        
        // Attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        attempt++;
      }
    }
    
    // Ce code ne devrait jamais être atteint grâce au throw dans le if (attempt === maxRetries)
    throw new Error(`Échec du chargement après ${maxRetries} tentatives`);
  }, [entityType, isOnline, status.isSyncing]);
  
  // Fonction pour planifier une synchronisation différée
  const scheduleSyncWithServer = useCallback((data: T[], config: SyncConfig, options: SyncOptions = {}) => {
    // Stocker les données à synchroniser
    pendingData.current = data;
    
    // Annuler tout timeout existant
    if (syncTimeoutRef.current !== null) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    const now = Date.now();
    const timeSinceLastSync = now - lastSyncTime.current;
    
    // Calculer le délai avant la prochaine synchronisation
    let delay = 0;
    if (!options.force && timeSinceLastSync < SYNC_DELAY) {
      delay = SYNC_DELAY - timeSinceLastSync;
    }
    
    console.log(`[${entityType}] Planification de la synchronisation dans ${delay}ms`);
    
    // Planifier la synchronisation
    syncTimeoutRef.current = setTimeout(() => {
      console.log(`[${entityType}] Exécution de la synchronisation différée`);
      syncWithServer(pendingData.current, config, options);
      syncTimeoutRef.current = null;
    }, delay);
    
    return true;
  }, [entityType]);
  
  // Synchroniser les données avec le serveur
  const syncWithServer = useCallback(async (data: T[], config: SyncConfig, options: SyncOptions = {}): Promise<boolean> => {
    // Vérifier si nous devons planifier une synchronisation différée
    const now = Date.now();
    const timeSinceLastSync = now - lastSyncTime.current;
    
    if (!options.force && timeSinceLastSync < SYNC_DELAY) {
      return scheduleSyncWithServer(data, config, options);
    }
    
    if (!isOnline) {
      console.log(`[${entityType}] Mode hors ligne, synchronisation avec le serveur impossible`);
      if (!options.silent) {
        toast({
          title: "Mode hors ligne",
          description: "La synchronisation sera effectuée lorsque la connexion sera rétablie",
          variant: "default"
        });
      }
      return false;
    }
    
    if (status.isSyncing) {
      console.log(`[${entityType}] Synchronisation déjà en cours, nouvelle requête planifiée`);
      return scheduleSyncWithServer(data, config, options);
    }
    
    setStatus(prev => ({ ...prev, isSyncing: true }));
    
    const { endpoint, userId } = config;
    
    try {
      const API_URL = getApiUrl();
      console.log(`[${entityType}] Synchronisation avec ${API_URL}/${endpoint}`);
      
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          [entityType]: data
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || `Échec de la synchronisation de ${entityType}`);
      }
      
      setStatus({
        isSyncing: false,
        syncFailed: false,
        lastSynced: new Date()
      });
      
      console.log(`[${entityType}] Synchronisation réussie`);
      lastSyncTime.current = Date.now();
      
      if (!options.silent) {
        toast({
          title: "Synchronisation réussie",
          description: `Les ${entityType} ont été synchronisés avec le serveur`,
        });
      }
      
      return true;
    } catch (error) {
      console.error(`[${entityType}] Erreur lors de la synchronisation:`, error);
      
      setStatus({
        isSyncing: false,
        syncFailed: true,
        lastSynced: status.lastSynced
      });
      
      if (!options.silent) {
        toast({
          title: "Erreur de synchronisation",
          description: error instanceof Error ? error.message : "Une erreur est survenue",
          variant: "destructive"
        });
      }
      
      return false;
    }
  }, [entityType, isOnline, status, toast, scheduleSyncWithServer]);
  
  // Nettoyer les timeouts à la destruction du composant
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current !== null) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    ...status,
    data,
    isOnline,
    loadFromServer,
    syncWithServer,
    scheduleSyncWithServer,
    resetSyncStatus
  };
};

/**
 * Hook global pour la synchronisation de toutes les données de l'application
 */
export const useGlobalSync = () => {
  const [isGlobalSyncing, setIsGlobalSyncing] = useState(false);
  const [lastGlobalSync, setLastGlobalSync] = useState<Date | null>(null);
  const [webSocketStatus, setWebSocketStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  const lastGlobalSyncTime = useRef<number>(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fonction pour synchroniser toutes les données
  const syncAllData = useCallback(async (data: Record<string, any[]> = {}) => {
    // Vérifier si nous devons planifier une synchronisation différée
    const now = Date.now();
    const timeSinceLastSync = now - lastGlobalSyncTime.current;
    
    if (timeSinceLastSync < SYNC_DELAY) {
      console.log(`[Global] Synchronisation demandée trop tôt, planification dans ${SYNC_DELAY - timeSinceLastSync}ms`);
      
      // Annuler tout timeout existant
      if (syncTimeoutRef.current !== null) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      return new Promise<boolean>(resolve => {
        syncTimeoutRef.current = setTimeout(async () => {
          console.log(`[Global] Exécution de la synchronisation globale différée`);
          const result = await syncAllData(data);
          resolve(result);
          syncTimeoutRef.current = null;
        }, SYNC_DELAY - timeSinceLastSync);
      });
    }
    
    if (!isOnline) {
      console.log('[Global] Mode hors ligne, synchronisation impossible');
      toast({
        title: "Mode hors ligne",
        description: "La synchronisation sera effectuée lorsque la connexion sera rétablie",
        variant: "default"
      });
      return false;
    }
    
    if (isGlobalSyncing) {
      console.log('[Global] Synchronisation déjà en cours');
      return false;
    }
    
    setIsGlobalSyncing(true);
    
    try {
      // Synchroniser toutes les données de manière séquentielle
      const types = Object.keys(data);
      console.log(`[Global] Synchronisation de ${types.length} types de données: ${types.join(', ')}`);
      
      let allSuccess = true;
      
      if (types.length === 0) {
        console.log('[Global] Aucune donnée à synchroniser');
        // Quand même mettre à jour la date de dernière synchronisation car
        // c'est peut-être juste un contrôle
        setLastGlobalSync(new Date());
        lastGlobalSyncTime.current = Date.now();
      } else {
        for (const type of types) {
          try {
            console.log(`[Global] Synchronisation des ${type}...`);
            const API_URL = getApiUrl();
            const userId = 'system'; // À adapter selon votre système
            
            const response = await fetch(`${API_URL}/${type}-sync.php`, {
              method: 'POST',
              headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                userId,
                [type]: data[type]
              })
            });
            
            if (!response.ok) {
              console.error(`[Global] Erreur HTTP lors de la synchronisation des ${type}: ${response.status}`);
              allSuccess = false;
              continue;
            }
            
            const result = await response.json();
            
            if (!result.success) {
              console.error(`[Global] Échec de la synchronisation des ${type}: ${result.message || 'Erreur inconnue'}`);
              allSuccess = false;
            } else {
              console.log(`[Global] Synchronisation des ${type} réussie`);
            }
          } catch (error) {
            console.error(`[Global] Erreur lors de la synchronisation des ${type}:`, error);
            allSuccess = false;
          }
        }
        
        setLastGlobalSync(new Date());
        lastGlobalSyncTime.current = Date.now();
      }
      
      return allSuccess;
    } catch (error) {
      console.error('[Global] Erreur lors de la synchronisation globale:', error);
      return false;
    } finally {
      setIsGlobalSyncing(false);
    }
  }, [isOnline, isGlobalSyncing, toast]);
  
  // Nettoyer les timeouts à la destruction du composant
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current !== null) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    isGlobalSyncing,
    lastGlobalSync,
    syncAllData,
    isOnline,
    webSocketStatus
  };
};
