
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getApiUrl, fetchWithErrorHandling } from '@/config/apiConfig';
import { getCurrentUser } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';

export interface SyncOptions<T> {
  endpoint: string;
  loadEndpoint: string;
  data: T[];
  userId: string | object;
  dataName?: string;
  additionalData?: any;
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

// Configuration globale pour la synchronisation
export const SYNC_CONFIG = {
  intervalSeconds: 30, // Augmenté à 30 secondes pour réduire la charge serveur
  retryMaxAttempts: 3,  // Nombre maximum de tentatives en cas d'échec
  retryDelayMs: 2000,   // Délai entre les tentatives en millisecondes
  syncTimeoutMs: 12000, // Timeout pour une opération de synchronisation
};

// Stockage partagé pour la dernière synchronisation
let lastGlobalSync: Date | null = null;
let isSyncingGlobally = false;
let syncQueue: (() => Promise<boolean>)[] = [];
let globalSyncSuccess = true;
let globalSyncAttempts = 0;

// Événement personnalisé pour la synchronisation
export const createSyncEvent = (success: boolean, type: string, details?: any) => {
  const event = new CustomEvent('app-sync', {
    detail: {
      success,
      type,
      timestamp: new Date(),
      details
    }
  });
  window.dispatchEvent(event);
  return event;
};

export const useSyncService = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const syncAttemptsRef = useRef<number>(0);

  // Effet pour nettoyer les intervalles à la destruction du composant
  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fonction pour initialiser un utilisateur pour les appels API
  const normalizeUserId = (userId: string | object): string => {
    if (typeof userId === 'object' && userId !== null) {
      return (userId as any).identifiant_technique || 
             (userId as any).email || 
             'default_user';
    }
    return String(userId);
  };

  const syncWithServer = async <T>(options: SyncOptions<T>): Promise<boolean> => {
    if (isSyncing) {
      console.log("[SyncService] Synchronisation déjà en cours, mise en file d'attente");
      return new Promise((resolve) => {
        syncQueue.push(async () => {
          const result = await _internalSync(options);
          resolve(result);
          return result;
        });
      });
    }

    return _internalSync(options);
  };

  const _internalSync = async <T>(options: SyncOptions<T>): Promise<boolean> => {
    if (!isOnline) {
      console.log("[SyncService] Tentative de synchronisation hors ligne, annulée.");
      toast({
        title: "Mode hors ligne",
        description: "La synchronisation sera effectuée lorsque vous serez en ligne",
        variant: "default"
      });
      return false;
    }
    
    // Créer un nouveau AbortController pour cette requête
    abortControllerRef.current = new AbortController();
    
    setIsSyncing(true);
    setSyncFailed(false);
    
    // Mettre à jour l'état de synchronisation global
    isSyncingGlobally = true;
    
    try {
      // Définir un timeout pour la synchronisation
      const syncPromise = new Promise<boolean>(async (resolve, reject) => {
        try {
          console.log(`[SyncService] Début de synchronisation avec ${options.endpoint}`);
          
          const currentUser = getCurrentUser();
          if (!currentUser) {
            console.warn("[SyncService] Pas d'utilisateur connecté pour synchroniser");
            toast({
              title: "Non connecté",
              description: "Vous devez être connecté pour synchroniser vos données",
              variant: "destructive"
            });
            resolve(false);
            return;
          }

          // Normaliser l'ID utilisateur
          const userId = normalizeUserId(options.userId);
          
          // Utiliser l'API configurée pour envoyer les données
          const response = await fetchWithErrorHandling(`${getApiUrl()}/${options.endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userId: userId,
              data: options.dataName ? { [options.dataName]: options.data } : options.data,
              ...options.additionalData
            }),
            signal: abortControllerRef.current.signal
          });

          console.log(`[SyncService] Réponse de synchronisation:`, response);
          
          // Mise à jour des états
          setLastSynced(new Date());
          lastGlobalSync = new Date();
          globalSyncSuccess = true;
          globalSyncAttempts = 0;
          
          // Émettre un événement de synchronisation réussie
          createSyncEvent(true, options.endpoint, {
            dataLength: options.data.length,
            timestamp: new Date()
          });
          
          resolve(true);
        } catch (error) {
          // Si l'erreur est due à une annulation, ne pas marquer comme échec
          if (error instanceof DOMException && error.name === 'AbortError') {
            console.warn("[SyncService] Synchronisation annulée par le timeout");
            resolve(false);
          } else {
            console.error(`[SyncService] Erreur de synchronisation avec ${options.endpoint}:`, error);
            setSyncFailed(true);
            globalSyncSuccess = false;
            syncAttemptsRef.current += 1;
            globalSyncAttempts += 1;
            
            // Émettre un événement d'échec de synchronisation
            createSyncEvent(false, options.endpoint, { 
              error: error instanceof Error ? error.message : String(error),
              attempts: syncAttemptsRef.current
            });
            
            reject(error);
          }
        }
      });
      
      // Créer un timeout pour la synchronisation
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        syncTimeoutRef.current = setTimeout(() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            reject(new Error("Timeout de synchronisation dépassé"));
          }
        }, SYNC_CONFIG.syncTimeoutMs);
      });
      
      // Attendre la première promesse qui se résout
      const result = await Promise.race([syncPromise, timeoutPromise]);
      
      return result;
    } catch (error) {
      console.error(`[SyncService] Erreur de synchronisation avec ${options.endpoint}:`, error);
      setSyncFailed(true);
      return false;
    } finally {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      abortControllerRef.current = null;
      setIsSyncing(false);
      isSyncingGlobally = false;
      
      // Traiter la file d'attente des synchronisations
      if (syncQueue.length > 0) {
        const nextSync = syncQueue.shift();
        if (nextSync) nextSync();
      }
    }
  };

  const loadFromServer = async <T>(options: LoadOptions): Promise<T[]> => {
    if (isSyncing) {
      console.warn("[SyncService] Une synchronisation est déjà en cours, chargement reporté");
      throw new Error("Une synchronisation est déjà en cours");
    }
    
    // Créer un nouveau AbortController pour cette requête
    abortControllerRef.current = new AbortController();
    
    setIsSyncing(true);
    setLoadError(null);
    
    try {
      console.log(`[SyncService] Chargement depuis ${options.loadEndpoint}`);
      
      // Normaliser l'ID utilisateur
      const userId = normalizeUserId(options.userId);

      // Utiliser timestamp pour éviter la mise en cache
      const timestamp = Date.now();
      const url = `${getApiUrl()}/${options.loadEndpoint}?userId=${encodeURIComponent(String(userId))}&_t=${timestamp}`;
      
      console.log(`[SyncService] URL de chargement: ${url}`);
      
      const response = await fetchWithErrorHandling(url, { 
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      // Vérifier si la réponse contient un champ de données
      const result = Array.isArray(response) ? response : 
                      response.data ? response.data : 
                      response.items ? response.items :
                      response.documents || response.exigences || response.membres || [];
      
      console.log(`[SyncService] Données chargées:`, result);
      
      // Émettre un événement de chargement réussi
      createSyncEvent(true, options.loadEndpoint, {
        dataLength: result.length,
        timestamp: new Date()
      });
      
      setLastSynced(new Date());
      lastGlobalSync = new Date();
      
      return result as T[];
    } catch (error) {
      // Si l'erreur est due à une annulation, utiliser un message plus clair
      if (error instanceof DOMException && error.name === 'AbortError') {
        const message = "Le chargement a été annulé car il prenait trop de temps";
        console.warn(`[SyncService] ${message}`);
        setLoadError(message);
        toast({
          title: "Chargement annulé",
          description: message,
          variant: "default"
        });
      } else {
        console.error(`[SyncService] Erreur de chargement depuis ${options.loadEndpoint}:`, error);
        const message = error instanceof Error ? error.message : "Erreur inconnue";
        setLoadError(message);
        
        // Émettre un événement d'échec de chargement
        createSyncEvent(false, options.loadEndpoint, { 
          error: message,
          timestamp: new Date()
        });
        
        toast({
          title: "Erreur de chargement",
          description: message,
          variant: "destructive"
        });
      }
      throw error;
    } finally {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      abortControllerRef.current = null;
      setIsSyncing(false);
    }
  };
  
  const resetSyncStatus = () => {
    setSyncFailed(false);
    setLoadError(null);
    syncAttemptsRef.current = 0;
    globalSyncAttempts = 0;
    
    // Annuler toute requête en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Nettoyer les timeouts et intervalles
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    
    // Vider la file d'attente
    syncQueue = [];
    isSyncingGlobally = false;
    setIsSyncing(false);
  };

  // Fonction pour planifier une synchronisation périodique
  const setupPeriodicSync = useCallback(<T>(
    syncFn: () => Promise<boolean>,
    intervalSeconds: number = SYNC_CONFIG.intervalSeconds
  ) => {
    // Nettoyer l'intervalle existant si présent
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
    
    console.log(`[SyncService] Mise en place d'une synchronisation périodique toutes les ${intervalSeconds} secondes`);
    
    // Créer un nouvel intervalle
    syncIntervalRef.current = setInterval(() => {
      if (!isOnline || isSyncingGlobally) {
        console.log(`[SyncService] Synchronisation périodique ignorée - ${!isOnline ? 'Hors ligne' : 'Déjà en cours'}`);
        return;
      }
      
      // Si trop d'échecs consécutifs, augmenter l'intervalle temporairement
      if (globalSyncAttempts > SYNC_CONFIG.retryMaxAttempts) {
        console.log("[SyncService] Trop d'échecs consécutifs, synchronisation suspendue temporairement");
        return;
      }
      
      // Exécuter la synchronisation
      syncFn().catch(error => {
        console.error("[SyncService] Erreur lors de la synchronisation périodique:", error);
      });
    }, intervalSeconds * 1000);
    
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isOnline]);

  // Ajouter des synchronisations à la file d'attente si une est déjà en cours
  const queueSync = useCallback(<T>(
    options: SyncOptions<T>
  ): Promise<boolean> => {
    if (!isOnline) {
      console.log("[SyncService] Mode hors ligne, synchronisation impossible");
      return Promise.resolve(false);
    }
    
    if (!isSyncingGlobally) {
      return syncWithServer(options);
    }
    
    console.log("[SyncService] Synchronisation ajoutée à la file d'attente");
    
    return new Promise((resolve) => {
      syncQueue.push(async () => {
        const result = await syncWithServer(options);
        resolve(result);
        return result;
      });
    });
  }, [isOnline]);

  return {
    syncWithServer,
    loadFromServer,
    isSyncing,
    syncFailed,
    lastSynced: lastSynced || lastGlobalSync,
    loadError,
    resetSyncStatus,
    setupPeriodicSync,
    queueSync,
    globalLastSync: lastGlobalSync,
    SYNC_CONFIG
  };
};
