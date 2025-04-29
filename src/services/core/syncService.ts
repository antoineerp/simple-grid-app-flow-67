
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
  intervalSeconds: 15, // Intervalle de synchronisation en secondes (15s par défaut)
  retryMaxAttempts: 3,  // Nombre maximum de tentatives en cas d'échec
  retryDelayMs: 2000,   // Délai entre les tentatives en millisecondes
  syncTimeoutMs: 30000, // Timeout pour une opération de synchronisation
};

// Stockage partagé pour la dernière synchronisation
let lastGlobalSync: Date | null = null;
let isSyncingGlobally = false;
let syncQueue: (() => Promise<boolean>)[] = [];

export const useSyncService = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Effet pour nettoyer les intervalles à la destruction du composant
  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  const syncWithServer = async <T>(options: SyncOptions<T>): Promise<boolean> => {
    if (isSyncing) return false;
    if (!isOnline) {
      console.log("[SyncService] Tentative de synchronisation hors ligne, annulée.");
      return false;
    }
    
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
            resolve(false);
            return;
          }

          // Utiliser l'API configurée pour envoyer les données
          const response = await fetchWithErrorHandling(`${getApiUrl()}/${options.endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userId: options.userId,
              data: options.dataName ? { [options.dataName]: options.data } : options.data,
              ...options.additionalData
            })
          });

          console.log(`[SyncService] Réponse de synchronisation:`, response);
          
          // Mise à jour des états
          setLastSynced(new Date());
          lastGlobalSync = new Date();
          
          resolve(true);
        } catch (error) {
          console.error(`[SyncService] Erreur de synchronisation avec ${options.endpoint}:`, error);
          setSyncFailed(true);
          reject(error);
        }
      });
      
      // Créer un timeout pour la synchronisation
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        syncTimeoutRef.current = setTimeout(() => {
          reject(new Error("Timeout de synchronisation dépassé"));
        }, options.maxRetries ? options.maxRetries * SYNC_CONFIG.syncTimeoutMs : SYNC_CONFIG.syncTimeoutMs);
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
      throw new Error("Une synchronisation est déjà en cours");
    }
    
    setIsSyncing(true);
    setLoadError(null);
    
    try {
      console.log(`[SyncService] Chargement depuis ${options.loadEndpoint}`);
      
      const userId = typeof options.userId === 'object' ? 
        (options.userId as any).identifiant_technique || 
        (options.userId as any).email || 
        'default_user' : 
        options.userId;

      const response = await fetchWithErrorHandling(`${getApiUrl()}/${options.loadEndpoint}?userId=${encodeURIComponent(String(userId))}`);
      
      // Vérifier si la réponse contient un champ de données
      const result = Array.isArray(response) ? response : 
                      response.data ? response.data : 
                      response.items ? response.items :
                      response.documents || response.exigences || response.membres || [];
      
      console.log(`[SyncService] Données chargées:`, result);
      
      setLastSynced(new Date());
      lastGlobalSync = new Date();
      
      return result as T[];
    } catch (error) {
      console.error(`[SyncService] Erreur de chargement depuis ${options.loadEndpoint}:`, error);
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      setLoadError(message);
      toast({
        title: "Erreur de chargement",
        description: message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };
  
  const resetSyncStatus = () => {
    setSyncFailed(false);
    setLoadError(null);
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
  }, []);

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

