/**
 * Service de synchronisation automatique centralisée
 * Ce service gère la synchronisation des données entre toutes les pages de l'application
 */
import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/services/auth/authService';
import { verifyJsonEndpoint } from '@/services/sync/robustSyncService';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// Interface pour les données d'un tableau
interface TableData {
  tableName: string;
  data: any[];
  lastModified: Date;
}

// Stockage temporaire des données en attente de synchronisation
const pendingChanges: Record<string, any[]> = {};
const syncTimestamps: Record<string, number> = {};
const initialDataLoaded: Record<string, boolean> = {};

// Intervalles de synchronisation (en ms)
const SYNC_INTERVAL = 5000; // 5 secondes (réduit de 10 secondes)
const RETRY_INTERVAL = 30000; // 30 secondes

// État global de la synchronisation
let isSyncInProgress = false;
let lastSyncAttempt = 0;
let syncIntervalId: number | null = null;

/**
 * Enregistre les données localement
 */
export const saveLocalData = <T>(tableName: string, data: T[]): void => {
  try {
    const currentUser = getCurrentUser() || 'default';
    const storageKey = `${tableName}_${currentUser}`;
    
    // Sauvegarder dans localStorage
    localStorage.setItem(storageKey, JSON.stringify(data));
    
    // Sauvegarder également dans sessionStorage pour persistance entre pages
    sessionStorage.setItem(storageKey, JSON.stringify(data));
    
    // Enregistrer l'horodatage de la dernière modification
    const timestamp = new Date().toISOString();
    localStorage.setItem(`${storageKey}_last_modified`, timestamp);
    sessionStorage.setItem(`${storageKey}_last_modified`, timestamp);
    
    console.log(`AutoSync: ${data.length} éléments sauvegardés pour ${tableName}`);
    
    // Ajouter aux modifications en attente
    pendingChanges[tableName] = data;
    syncTimestamps[tableName] = Date.now();
    
    // Émettre un événement pour notification
    window.dispatchEvent(new CustomEvent('data-changed', { 
      detail: { tableName, count: data.length }
    }));
  } catch (error) {
    console.error(`AutoSync: Erreur lors de la sauvegarde des données pour ${tableName}:`, error);
  }
};

/**
 * Charge les données depuis le stockage local
 */
export const loadLocalData = <T>(tableName: string): T[] => {
  try {
    const currentUser = getCurrentUser() || 'default';
    const storageKey = `${tableName}_${currentUser}`;
    
    // Essayer d'abord sessionStorage (plus récent)
    let data = sessionStorage.getItem(storageKey);
    
    // Si pas trouvé, essayer localStorage
    if (!data) {
      data = localStorage.getItem(storageKey);
    }
    
    if (data) {
      const parsedData = JSON.parse(data);
      console.log(`AutoSync: ${parsedData.length} éléments chargés pour ${tableName}`);
      
      // Marquer comme chargé initialement
      initialDataLoaded[tableName] = true;
      
      return parsedData;
    }
    
    console.log(`AutoSync: Aucune donnée locale pour ${tableName}`);
    return [];
  } catch (error) {
    console.error(`AutoSync: Erreur lors du chargement des données pour ${tableName}:`, error);
    return [];
  }
};

/**
 * Effectue la synchronisation des données avec le serveur
 */
export const syncWithServer = async <T>(tableName: string, data: T[]): Promise<boolean> => {
  if (isSyncInProgress) {
    console.log(`AutoSync: Synchronisation déjà en cours, ignorée pour ${tableName}`);
    return false;
  }
  
  const currentUser = getCurrentUser() || 'default';
  
  try {
    isSyncInProgress = true;
    lastSyncAttempt = Date.now();
    
    // Vérifier d'abord si l'endpoint JSON est valide
    const isEndpointValid = await verifyJsonEndpoint();
    if (!isEndpointValid) {
      console.error(`AutoSync: Point d'accès API invalide pour ${tableName}`);
      isSyncInProgress = false;
      return false;
    }
    
    console.log(`AutoSync: Synchronisation de ${data.length} éléments pour ${tableName}`);
    
    // Préparer l'URL de l'endpoint
    const API_URL = process.env.API_URL || '/api';
    const endpoint = `${API_URL}/${tableName}-sync.php`;
    
    // Effectuer la requête
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      },
      body: JSON.stringify({
        userId: currentUser,
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
        console.log(`AutoSync: Synchronisation réussie pour ${tableName}`);
        
        // Supprimer des modifications en attente
        delete pendingChanges[tableName];
        
        // Enregistrer la date de dernière synchronisation
        const syncTime = new Date().toISOString();
        localStorage.setItem(`${tableName}_${currentUser}_last_synced`, syncTime);
        
        // Diffuser un événement de synchronisation réussie
        window.dispatchEvent(new CustomEvent('sync-success', { 
          detail: { tableName, timestamp: syncTime }
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
    console.error(`AutoSync: Erreur lors de la synchronisation de ${tableName}:`, error);
    
    // Diffuser un événement d'erreur
    window.dispatchEvent(new CustomEvent('sync-error', { 
      detail: { tableName, error: error instanceof Error ? error.message : String(error) }
    }));
    
    return false;
  } finally {
    isSyncInProgress = false;
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
    // Ne pas déclencher si une synchronisation est déjà en cours
    if (isSyncInProgress) {
      return;
    }
    
    // Ne pas synchroniser s'il n'y a pas de données en attente
    const tablesWithChanges = Object.keys(pendingChanges);
    if (tablesWithChanges.length === 0) {
      return;
    }
    
    // Vérifier si nous sommes en ligne
    if (!navigator.onLine) {
      console.log('AutoSync: Hors ligne, synchronisation reportée');
      return;
    }
    
    // Synchroniser toutes les tables modifiées
    console.log(`AutoSync: Synchronisation automatique de ${tablesWithChanges.length} tables`);
    
    // Prendre la table la plus anciennement modifiée
    tablesWithChanges.sort((a, b) => (syncTimestamps[a] || 0) - (syncTimestamps[b] || 0));
    const tableName = tablesWithChanges[0];
    
    if (tableName && pendingChanges[tableName]) {
      syncWithServer(tableName, pendingChanges[tableName]).catch(error => {
        console.error(`AutoSync: Erreur lors de la synchronisation automatique de ${tableName}:`, error);
      });
    }
  }, SYNC_INTERVAL);
  
  console.log(`AutoSync: Synchronisation automatique démarrée (intervalle: ${SYNC_INTERVAL}ms)`);
  
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
  
  // Synchroniser toutes les tables modifiées
  const tablesWithChanges = Object.keys(pendingChanges);
  
  if (tablesWithChanges.length > 0) {
    console.log(`AutoSync: ${tablesWithChanges.length} tables à synchroniser après reconnexion`);
    
    // Synchroniser une table à la fois, en commençant par la plus ancienne
    tablesWithChanges.sort((a, b) => (syncTimestamps[a] || 0) - (syncTimestamps[b] || 0));
    const tableName = tablesWithChanges[0];
    
    if (tableName && pendingChanges[tableName]) {
      syncWithServer(tableName, pendingChanges[tableName]).catch(error => {
        console.error(`AutoSync: Erreur lors de la synchronisation après reconnexion de ${tableName}:`, error);
      });
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
  if (document.visibilityState === 'visible') {
    console.log('AutoSync: Onglet actif, vérification des synchronisations en attente');
    
    // Si la dernière tentative date de plus de 30 secondes, réessayer
    if (Date.now() - lastSyncAttempt > RETRY_INTERVAL) {
      handleOnline();
    }
  }
}

/**
 * Hook personnalisé pour utiliser le service de synchronisation automatique
 */
export const useAutoSync = <T>(tableName: string) => {
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  const [data, setData] = useState<T[]>([]);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  // Charger les données initiales
  useEffect(() => {
    // Si les données sont déjà chargées, ne pas recharger
    if (initialDataLoaded[tableName]) {
      return;
    }
    
    const loadInitialData = async () => {
      // Charger depuis le stockage local
      const localData = loadLocalData<T>(tableName);
      
      if (localData.length > 0) {
        setData(localData);
        
        // Récupérer la date de dernière synchronisation
        const currentUser = getCurrentUser() || 'default';
        const lastSyncedStr = localStorage.getItem(`${tableName}_${currentUser}_last_synced`);
        
        if (lastSyncedStr) {
          setLastSynced(new Date(lastSyncedStr));
        }
      }
      
      // Si en ligne, essayer de synchroniser
      if (isOnline) {
        setIsSyncing(true);
        try {
          const success = await syncWithServer(tableName, localData);
          if (success) {
            setLastSynced(new Date());
          }
        } catch (error) {
          console.error(`useAutoSync: Erreur lors de la synchronisation initiale de ${tableName}:`, error);
          toast({
            title: "Erreur de synchronisation",
            description: "Impossible de synchroniser les données avec le serveur. Les modifications sont sauvegardées localement.",
            variant: "destructive"
          });
        } finally {
          setIsSyncing(false);
        }
      }
    };
    
    loadInitialData();
  }, [tableName, isOnline, toast]);
  
  // Écouter les événements de changement de données
  useEffect(() => {
    const handleDataChanged = (event: CustomEvent) => {
      if (event.detail?.tableName === tableName) {
        // Recharger les données
        const localData = loadLocalData<T>(tableName);
        setData(localData);
      }
    };
    
    const handleSyncSuccess = (event: CustomEvent) => {
      if (event.detail?.tableName === tableName) {
        setLastSynced(new Date(event.detail.timestamp));
        setIsSyncing(false);
      }
    };
    
    const handleSyncError = (event: CustomEvent) => {
      if (event.detail?.tableName === tableName) {
        setIsSyncing(false);
        toast({
          title: "Erreur de synchronisation",
          description: event.detail.error || "Impossible de synchroniser avec le serveur",
          variant: "destructive"
        });
      }
    };
    
    // Ajouter les écouteurs
    window.addEventListener('data-changed', handleDataChanged as EventListener);
    window.addEventListener('sync-success', handleSyncSuccess as EventListener);
    window.addEventListener('sync-error', handleSyncError as EventListener);
    
    // Nettoyage
    return () => {
      window.removeEventListener('data-changed', handleDataChanged as EventListener);
      window.removeEventListener('sync-success', handleSyncSuccess as EventListener);
      window.removeEventListener('sync-error', handleSyncError as EventListener);
    };
  }, [tableName, toast]);
  
  // Fonction pour sauvegarder et synchroniser les données
  const saveData = (newData: T[]) => {
    // Sauvegarder localement
    saveLocalData(tableName, newData);
    setData(newData);
  };
  
  // Fonction pour forcer une synchronisation
  const forceSyncWithServer = async () => {
    if (!isOnline) {
      toast({
        title: "Hors ligne",
        description: "Vous êtes actuellement hors ligne. Les données sont sauvegardées localement et seront synchronisées dès que la connexion sera rétablie.",
        variant: "destructive"
      });
      return false;
    }
    
    setIsSyncing(true);
    try {
      const success = await syncWithServer(tableName, data);
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
      console.error(`useAutoSync: Erreur lors de la synchronisation forcée de ${tableName}:`, error);
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
    syncWithServer: forceSyncWithServer
  };
};

// Initialiser la synchronisation automatique au chargement
if (typeof window !== 'undefined') {
  // Attendre un peu pour permettre à l'application de se charger
  setTimeout(() => {
    startAutoSync();
  }, 2000);
}

// Exporter les fonctions et hook
export default {
  saveLocalData,
  loadLocalData,
  syncWithServer,
  startAutoSync,
  stopAutoSync,
  useAutoSync
};
