
/**
 * Service de synchronisation automatique centralisée
 * Ce service gère la synchronisation des données entre toutes les pages de l'application
 */
import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { verifyJsonEndpoint } from '@/services/sync/robustSyncService';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { ensureCorrectUserId } from '@/services/core/userIdConverter';
import { getApiUrl } from '@/config/apiConfig';

// Interface pour les données d'un tableau
interface TableData {
  tableName: string;
  data: any[];
  lastModified: Date;
}

// Stockage temporaire des données en attente de synchronisation
const pendingChanges: Record<string, Record<string, any[]>> = {}; // Organisé par utilisateur puis par table
const syncTimestamps: Record<string, Record<string, number>> = {}; // Organisé par utilisateur puis par table
const initialDataLoaded: Record<string, Record<string, boolean>> = {}; // Organisé par utilisateur puis par table

// Intervalles de synchronisation (en ms)
const SYNC_INTERVAL = 60000; // 60 secondes
const RETRY_INTERVAL = 120000; // 2 minutes

// État global de la synchronisation
let isSyncInProgress = false;
let lastSyncAttempt = 0;
let syncIntervalId: number | null = null;
let syncEnabled = true; // Indicateur pour activer/désactiver la synchronisation

// Événements de synchronisation
export const SYNC_EVENTS = {
  SYNC_START: 'sync-start',
  SYNC_SUCCESS: 'sync-success', 
  SYNC_ERROR: 'sync-error',
  DATA_CHANGED: 'data-changed',
  SYNC_COMPLETED: 'sync-completed'
};

// Fonction utilitaire pour générer une clé de stockage cohérente
const getStorageKey = (tableName: string, userId: string): string => {
  // S'assurer que l'ID utilisateur est valide et correctement formaté
  const safeUserId = ensureCorrectUserId(userId);
  return `${tableName}_${safeUserId}`;
};

/**
 * Active ou désactive la synchronisation automatique
 */
export const setSyncEnabled = (enabled: boolean): void => {
  syncEnabled = enabled;
  if (enabled) {
    console.log('AutoSync: Synchronisation automatique activée');
    if (!syncIntervalId) {
      startAutoSync();
    }
  } else {
    console.log('AutoSync: Synchronisation automatique désactivée');
    stopAutoSync();
  }
};

/**
 * Enregistre les données localement avec un ID utilisateur explicite
 */
export const saveLocalData = <T>(tableName: string, data: T[], userId: string): void => {
  try {
    const safeUserId = ensureCorrectUserId(userId);
    const storageKey = getStorageKey(tableName, safeUserId);
    
    // Sauvegarder dans localStorage
    localStorage.setItem(storageKey, JSON.stringify(data));
    
    // Sauvegarder également dans sessionStorage pour persistance entre pages
    sessionStorage.setItem(storageKey, JSON.stringify(data));
    
    // Enregistrer l'horodatage de la dernière modification
    const timestamp = new Date().toISOString();
    localStorage.setItem(`${storageKey}_last_modified`, timestamp);
    sessionStorage.setItem(`${storageKey}_last_modified`, timestamp);
    
    console.log(`AutoSync: ${data.length} éléments sauvegardés pour ${tableName} de l'utilisateur ${safeUserId}`);
    
    // Initialiser les structures de données pour cet utilisateur si nécessaires
    if (!pendingChanges[safeUserId]) pendingChanges[safeUserId] = {};
    if (!syncTimestamps[safeUserId]) syncTimestamps[safeUserId] = {};
    
    // Ajouter aux modifications en attente
    pendingChanges[safeUserId][tableName] = data;
    syncTimestamps[safeUserId][tableName] = Date.now();
    
    // Émettre un événement pour notification
    window.dispatchEvent(new CustomEvent(SYNC_EVENTS.DATA_CHANGED, { 
      detail: { tableName, userId: safeUserId, count: data.length }
    }));
  } catch (error) {
    console.error(`AutoSync: Erreur lors de la sauvegarde des données pour ${tableName}:`, error);
  }
};

/**
 * Charge les données depuis le stockage local pour un utilisateur spécifique
 */
export const loadLocalData = <T>(tableName: string, userId: string): T[] => {
  try {
    const safeUserId = ensureCorrectUserId(userId);
    const storageKey = getStorageKey(tableName, safeUserId);
    
    // Essayer d'abord sessionStorage (plus récent)
    let data = sessionStorage.getItem(storageKey);
    
    // Si pas trouvé, essayer localStorage
    if (!data) {
      data = localStorage.getItem(storageKey);
    }
    
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        console.log(`AutoSync: ${parsedData.length} éléments chargés pour ${tableName} de l'utilisateur ${safeUserId}`);
        
        // Initialiser la structure pour cet utilisateur si nécessaire
        if (!initialDataLoaded[safeUserId]) initialDataLoaded[safeUserId] = {};
        
        // Marquer comme chargé initialement
        initialDataLoaded[safeUserId][tableName] = true;
        
        return parsedData;
      } catch (parseError) {
        console.error(`AutoSync: Erreur de parsing pour ${storageKey}:`, parseError);
        return [];
      }
    }
    
    console.log(`AutoSync: Aucune donnée locale pour ${tableName} de l'utilisateur ${safeUserId}`);
    return [];
  } catch (error) {
    console.error(`AutoSync: Erreur lors du chargement des données pour ${tableName}:`, error);
    return [];
  }
};

/**
 * Effectue la synchronisation des données avec le serveur pour un utilisateur spécifique
 */
export const syncWithServer = async <T>(tableName: string, data: T[], userId: string): Promise<boolean> => {
  if (!syncEnabled) {
    console.log(`AutoSync: Synchronisation désactivée, ignorée pour ${tableName}`);
    return false;
  }
  
  if (isSyncInProgress) {
    console.log(`AutoSync: Synchronisation déjà en cours, ignorée pour ${tableName}`);
    return false;
  }
  
  const safeUserId = ensureCorrectUserId(userId);
  
  // Diffuser un événement de début de synchronisation
  window.dispatchEvent(new CustomEvent(SYNC_EVENTS.SYNC_START, { 
    detail: { tableName, userId: safeUserId, count: data.length }
  }));
  
  try {
    isSyncInProgress = true;
    lastSyncAttempt = Date.now();
    
    // Vérifier d'abord si l'endpoint JSON est valide
    const isEndpointValid = await verifyJsonEndpoint();
    if (!isEndpointValid) {
      console.error(`AutoSync: Point d'accès API invalide pour ${tableName}`);
      isSyncInProgress = false;
      
      // Diffuser un événement d'erreur
      window.dispatchEvent(new CustomEvent(SYNC_EVENTS.SYNC_ERROR, { 
        detail: { tableName, userId: safeUserId, error: "Point d'accès API invalide" }
      }));
      
      return false;
    }
    
    console.log(`AutoSync: Synchronisation de ${data.length} éléments pour ${tableName} de l'utilisateur ${safeUserId}`);
    
    // Préparer l'URL de l'endpoint
    const API_URL = getApiUrl();
    const endpoint = `${API_URL}/${tableName}-sync.php`;
    
    console.log(`AutoSync: Envoi à ${endpoint} avec utilisateur ${safeUserId}`);
    
    // Effectuer la requête
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-User-Id': safeUserId // Ajouter l'ID utilisateur dans les headers pour sécurité additionnelle
      },
      body: JSON.stringify({
        userId: safeUserId,
        [tableName]: data
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
    }
    
    const responseText = await response.text();
    
    try {
      const responseData = JSON.parse(responseText);
      
      if (responseData.success === true) {
        console.log(`AutoSync: Synchronisation réussie pour ${tableName} de l'utilisateur ${safeUserId}`);
        
        // Supprimer des modifications en attente
        if (pendingChanges[safeUserId]) {
          delete pendingChanges[safeUserId][tableName];
        }
        
        // Enregistrer la date de dernière synchronisation
        const syncTime = new Date().toISOString();
        localStorage.setItem(`${tableName}_${safeUserId}_last_synced`, syncTime);
        
        // Diffuser un événement de synchronisation réussie
        window.dispatchEvent(new CustomEvent(SYNC_EVENTS.SYNC_SUCCESS, { 
          detail: { tableName, userId: safeUserId, timestamp: syncTime }
        }));
        
        return true;
      } else {
        throw new Error(responseData.message || 'Le serveur a signalé une erreur');
      }
    } catch (parseError) {
      console.error(`AutoSync: Erreur lors du parsing de la réponse pour ${tableName}:`, parseError);
      console.error(`AutoSync: Début de la réponse: ${responseText.substring(0, 200)}`);
      throw new Error(`Erreur de parsing: ${parseError.message}`);
    }
  } catch (error) {
    console.error(`AutoSync: Erreur lors de la synchronisation de ${tableName} pour ${userId}:`, error);
    
    // Diffuser un événement d'erreur
    window.dispatchEvent(new CustomEvent(SYNC_EVENTS.SYNC_ERROR, { 
      detail: { tableName, userId: safeUserId, error: error instanceof Error ? error.message : String(error) }
    }));
    
    return false;
  } finally {
    isSyncInProgress = false;
    
    // Diffuser un événement de fin de synchronisation
    window.dispatchEvent(new CustomEvent(SYNC_EVENTS.SYNC_COMPLETED, { 
      detail: { tableName, userId: safeUserId, timestamp: new Date().toISOString() }
    }));
  }
};

/**
 * Démarre le processus de synchronisation automatique
 */
export const startAutoSync = (): void => {
  if (syncIntervalId !== null) {
    clearInterval(syncIntervalId);
  }
  
  syncIntervalId = window.setInterval(() => {
    // Ne pas déclencher si la synchronisation est désactivée
    if (!syncEnabled) {
      return;
    }
    
    // Ne pas déclencher si une synchronisation est déjà en cours
    if (isSyncInProgress) {
      return;
    }
    
    // Vérifier si nous sommes en ligne
    if (!navigator.onLine) {
      console.log('AutoSync: Hors ligne, synchronisation reportée');
      return;
    }
    
    // Parcourir tous les utilisateurs ayant des modifications en attente
    const userIds = Object.keys(pendingChanges);
    
    for (const userId of userIds) {
      const userTables = pendingChanges[userId];
      if (!userTables || Object.keys(userTables).length === 0) continue;
      
      // Prendre la table la plus anciennement modifiée pour cet utilisateur
      const tablesWithChanges = Object.keys(userTables);
      tablesWithChanges.sort((a, b) => (syncTimestamps[userId]?.[a] || 0) - (syncTimestamps[userId]?.[b] || 0));
      
      const tableName = tablesWithChanges[0];
      if (tableName && userTables[tableName]) {
        console.log(`AutoSync: Synchronisation automatique de ${tableName} pour l'utilisateur ${userId}`);
        syncWithServer(tableName, userTables[tableName], userId).catch(error => {
          console.error(`AutoSync: Erreur lors de la synchronisation automatique de ${tableName}:`, error);
        });
        
        // Ne synchroniser qu'une table à la fois pour éviter les problèmes
        break;
      }
    }
  }, SYNC_INTERVAL);
  
  console.log(`AutoSync: Synchronisation automatique démarrée (intervalle: ${SYNC_INTERVAL/1000}s)`);
  
  // Ajouter aussi des écouteurs pour les événements réseau
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Ajouter un écouteur pour visibility change (quand l'utilisateur revient sur l'onglet)
  document.addEventListener('visibilitychange', handleVisibilityChange);
};

/**
 * Arrête le processus de synchronisation automatique
 */
export const stopAutoSync = (): void => {
  if (syncIntervalId !== null) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
  
  // Supprimer les écouteurs
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  
  console.log('AutoSync: Synchronisation automatique arrêtée');
};

/**
 * Gère l'événement de retour en ligne
 */
function handleOnline() {
  console.log('AutoSync: Connexion rétablie, tentative de synchronisation');
  
  // Ne pas synchroniser si la synchronisation est désactivée
  if (!syncEnabled) {
    return;
  }
  
  // Parcourir tous les utilisateurs ayant des modifications en attente
  const userIds = Object.keys(pendingChanges);
  
  for (const userId of userIds) {
    const userTables = pendingChanges[userId];
    if (!userTables || Object.keys(userTables).length === 0) continue;
    
    // Prendre la table la plus anciennement modifiée pour cet utilisateur
    const tablesWithChanges = Object.keys(userTables);
    if (tablesWithChanges.length > 0) {
      tablesWithChanges.sort((a, b) => (syncTimestamps[userId]?.[a] || 0) - (syncTimestamps[userId]?.[b] || 0));
      
      const tableName = tablesWithChanges[0];
      if (tableName && userTables[tableName]) {
        console.log(`AutoSync: Synchronisation après reconnexion de ${tableName} pour l'utilisateur ${userId}`);
        
        syncWithServer(tableName, userTables[tableName], userId).catch(error => {
          console.error(`AutoSync: Erreur lors de la synchronisation après reconnexion de ${tableName}:`, error);
        });
        
        // Ne synchroniser qu'une table à la fois
        break;
      }
    }
  }
}

/**
 * Gère l'événement de mise hors ligne
 */
function handleOffline() {
  console.log('AutoSync: Connexion perdue, synchronisation en pause');
}

/**
 * Gère l'événement de changement de visibilité de la page
 */
function handleVisibilityChange() {
  if (!syncEnabled) {
    return;
  }
  
  if (document.visibilityState === 'visible') {
    console.log('AutoSync: Onglet actif, vérification des synchronisations en attente');
    
    // Si la dernière tentative date de plus de l'intervalle de réessai, réessayer
    if (Date.now() - lastSyncAttempt > RETRY_INTERVAL) {
      handleOnline();
    }
  }
}

/**
 * Vérifie s'il y a des modifications en attente de synchronisation pour un utilisateur spécifique
 */
export const hasPendingChanges = (tableName?: string, userId?: string): boolean => {
  const safeUserId = ensureCorrectUserId(userId || getCurrentUser());
  
  if (!pendingChanges[safeUserId]) return false;
  
  if (tableName) {
    return !!pendingChanges[safeUserId][tableName];
  }
  
  return Object.keys(pendingChanges[safeUserId]).length > 0;
};

/**
 * Obtient l'horodatage de la dernière synchronisation pour une table d'un utilisateur
 */
export const getLastSynced = (tableName: string, userId?: string): Date | null => {
  try {
    const safeUserId = ensureCorrectUserId(userId || getCurrentUser());
    const lastSyncedStr = localStorage.getItem(`${tableName}_${safeUserId}_last_synced`);
    return lastSyncedStr ? new Date(lastSyncedStr) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Force la synchronisation de toutes les tables avec des changements en attente pour un utilisateur
 */
export const forceSync = async (userId?: string): Promise<Record<string, boolean>> => {
  if (!syncEnabled) {
    return {};
  }
  
  const safeUserId = ensureCorrectUserId(userId || getCurrentUser());
  const results: Record<string, boolean> = {};
  
  if (!pendingChanges[safeUserId]) {
    console.log(`AutoSync: Aucune modification en attente pour l'utilisateur ${safeUserId}`);
    return results;
  }
  
  const tablesWithChanges = Object.keys(pendingChanges[safeUserId]);
  
  if (tablesWithChanges.length === 0) {
    return results;
  }
  
  console.log(`AutoSync: Forçage de la synchronisation pour ${tablesWithChanges.length} tables de l'utilisateur ${safeUserId}`);
  
  for (const tableName of tablesWithChanges) {
    if (pendingChanges[safeUserId][tableName]) {
      try {
        const success = await syncWithServer(tableName, pendingChanges[safeUserId][tableName], safeUserId);
        results[tableName] = success;
      } catch (error) {
        console.error(`AutoSync: Erreur lors du forçage de la synchronisation de ${tableName}:`, error);
        results[tableName] = false;
      }
    }
  }
  
  return results;
};

/**
 * Hook personnalisé pour utiliser le service de synchronisation automatique
 */
export const useAutoSync = <T>(tableName: string, userId?: string) => {
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  const [data, setData] = useState<T[]>([]);
  const [lastSynced, setLastSynced] = useState<Date | null>(getLastSynced(tableName, userId));
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  // Utiliser l'ID utilisateur fourni ou récupérer l'utilisateur courant
  const safeUserId = ensureCorrectUserId(userId || getCurrentUser());
  
  // Charger les données initiales
  useEffect(() => {
    // Initialiser la structure de données si nécessaire
    if (!initialDataLoaded[safeUserId]) initialDataLoaded[safeUserId] = {};
    
    // Si les données sont déjà chargées pour cet utilisateur, ne pas recharger
    if (initialDataLoaded[safeUserId][tableName]) {
      console.log(`AutoSync: Données déjà chargées pour ${tableName} et utilisateur ${safeUserId}`);
      return;
    }
    
    const loadInitialData = async () => {
      console.log(`AutoSync: Chargement initial des données pour ${tableName} et utilisateur ${safeUserId}`);
      
      // Charger depuis le stockage local
      const localData = loadLocalData<T>(tableName, safeUserId);
      
      if (localData.length > 0) {
        setData(localData);
        
        // Récupérer la date de dernière synchronisation
        const lastSyncDate = getLastSynced(tableName, safeUserId);
        if (lastSyncDate) {
          setLastSynced(lastSyncDate);
        }
      }
      
      // Si en ligne et que la synchronisation est activée, essayer de synchroniser
      if (isOnline && syncEnabled) {
        setIsSyncing(true);
        try {
          const success = await syncWithServer(tableName, localData, safeUserId);
          if (success) {
            setLastSynced(new Date());
          }
        } catch (error) {
          console.error(`useAutoSync: Erreur lors de la synchronisation initiale de ${tableName} pour ${safeUserId}:`, error);
          // Ne pas afficher de toast pour les erreurs initiales
        } finally {
          setIsSyncing(false);
        }
      }
    };
    
    loadInitialData();
  }, [tableName, isOnline, safeUserId]);
  
  // Écouter les événements de synchronisation
  useEffect(() => {
    const handleSyncStart = (event: CustomEvent) => {
      if (event.detail?.tableName === tableName && event.detail?.userId === safeUserId) {
        setIsSyncing(true);
      }
    };
    
    const handleSyncCompleted = (event: CustomEvent) => {
      if (event.detail?.tableName === tableName && event.detail?.userId === safeUserId) {
        setIsSyncing(false);
      }
    };
    
    const handleDataChanged = (event: CustomEvent) => {
      if (event.detail?.tableName === tableName && event.detail?.userId === safeUserId) {
        // Recharger les données
        const localData = loadLocalData<T>(tableName, safeUserId);
        setData(localData);
      }
    };
    
    const handleSyncSuccess = (event: CustomEvent) => {
      if (event.detail?.tableName === tableName && event.detail?.userId === safeUserId) {
        setLastSynced(new Date(event.detail.timestamp));
      }
    };
    
    // Ajouter les écouteurs
    window.addEventListener(SYNC_EVENTS.SYNC_START, handleSyncStart as EventListener);
    window.addEventListener(SYNC_EVENTS.SYNC_COMPLETED, handleSyncCompleted as EventListener);
    window.addEventListener(SYNC_EVENTS.DATA_CHANGED, handleDataChanged as EventListener);
    window.addEventListener(SYNC_EVENTS.SYNC_SUCCESS, handleSyncSuccess as EventListener);
    
    // Nettoyage
    return () => {
      window.removeEventListener(SYNC_EVENTS.SYNC_START, handleSyncStart as EventListener);
      window.removeEventListener(SYNC_EVENTS.SYNC_COMPLETED, handleSyncCompleted as EventListener);
      window.removeEventListener(SYNC_EVENTS.DATA_CHANGED, handleDataChanged as EventListener);
      window.removeEventListener(SYNC_EVENTS.SYNC_SUCCESS, handleSyncSuccess as EventListener);
    };
  }, [tableName, safeUserId]);
  
  // Fonction pour sauvegarder les données
  const saveData = (newData: T[]) => {
    // Sauvegarder localement
    saveLocalData(tableName, newData, safeUserId);
    setData(newData);
  };
  
  // Fonction pour forcer une synchronisation
  const forceSyncWithServer = async (): Promise<boolean> => {
    if (!isOnline) {
      toast({
        title: "Hors ligne",
        description: "Vous êtes actuellement hors ligne. Les données sont sauvegardées localement et seront synchronisées dès que la connexion sera rétablie.",
        variant: "destructive"
      });
      return false;
    }
    
    if (!syncEnabled) {
      toast({
        title: "Synchronisation désactivée",
        description: "La synchronisation automatique est actuellement désactivée.",
        variant: "destructive"
      });
      return false;
    }
    
    setIsSyncing(true);
    try {
      const success = await syncWithServer(tableName, data, safeUserId);
      if (success) {
        setLastSynced(new Date());
        toast({
          title: "Synchronisation réussie",
          description: `Les données de ${tableName} ont été synchronisées avec succès.`
        });
        return true;
      } else {
        toast({
          title: "Échec de synchronisation",
          description: "Impossible de synchroniser avec le serveur. Vos modifications sont sauvegardées localement.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error(`useAutoSync: Erreur lors de la synchronisation forcée de ${tableName} pour ${safeUserId}:`, error);
      toast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  };
  
  return {
    data,
    setData: saveData,
    isSyncing,
    isOnline,
    lastSynced,
    syncWithServer: forceSyncWithServer,
    hasPendingChanges: () => hasPendingChanges(tableName, safeUserId),
    userId: safeUserId // Exposer l'ID utilisateur utilisé
  };
};

// Initialiser la synchronisation automatique au chargement
if (typeof window !== 'undefined') {
  // Attendre un peu pour permettre à l'application de se charger
  setTimeout(() => {
    startAutoSync();
    console.log('AutoSync: Service de synchronisation initialisé');
  }, 2000);
}

// Exporter les fonctions et hook
export default {
  saveLocalData,
  loadLocalData,
  syncWithServer,
  startAutoSync,
  stopAutoSync,
  useAutoSync,
  setSyncEnabled,
  forceSync,
  hasPendingChanges,
  getLastSynced,
  SYNC_EVENTS,
  getStorageKey // Exporter la fonction utilitaire pour les tests
};
