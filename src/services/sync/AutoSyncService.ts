
import { toast } from '@/components/ui/use-toast';
import { validateUserId, securePost, secureGet } from '../core/apiInterceptor';

// Types pour le gestionnaire de synchronisation
interface SyncResult {
  success: boolean;
  message?: string;
}

interface TableStatus {
  isSyncing: boolean;
  lastSynced: number | null;
  hasError: boolean;
  errorMessage: string | null;
  hasPendingChanges: boolean;
}

// Map pour stocker l'état de synchronisation des tables
const tableStatuses: Map<string, TableStatus> = new Map();

// Intervalle de synchronisation (en millisecondes)
const SYNC_INTERVAL = 60000; // 1 minute

// Stockage local pour les données
export const saveLocalData = <T>(tableName: string, data: T[], userId: string): void => {
  if (!userId) {
    throw new Error("ID utilisateur requis pour sauvegarder des données");
  }
  
  const storageKey = `${tableName}_${userId}`;
  localStorage.setItem(storageKey, JSON.stringify(data));
  
  // Marquer les modifications en attente
  const status = tableStatuses.get(tableName) || createDefaultStatus();
  status.hasPendingChanges = true;
  tableStatuses.set(tableName, status);
  
  // Déclencher un événement pour notifier le changement
  window.dispatchEvent(new CustomEvent('data-changed', { detail: { table: tableName, userId } }));
};

// Charger les données du stockage local
export const loadLocalData = <T>(tableName: string, userId: string): T[] => {
  if (!userId) {
    throw new Error("ID utilisateur requis pour charger des données");
  }
  
  const storageKey = `${tableName}_${userId}`;
  const data = localStorage.getItem(storageKey);
  
  if (data) {
    try {
      return JSON.parse(data) as T[];
    } catch (e) {
      console.error(`Erreur lors du chargement des données locales pour ${tableName}:`, e);
    }
  }
  
  return [];
};

// Fonction pour synchroniser les données avec le serveur
export const syncWithServer = async <T>(tableName: string, data: T[], userId: string): Promise<boolean> => {
  // Valider que l'ID utilisateur est présent
  validateUserId();
  
  if (tableName !== 'settings' && !userId) {
    console.error("Tentative de synchronisation sans ID utilisateur");
    toast({
      title: "Erreur de synchronisation",
      description: "Identifiant utilisateur manquant",
      variant: "destructive"
    });
    return false;
  }
  
  // Mettre à jour le statut de synchronisation
  const status = tableStatuses.get(tableName) || createDefaultStatus();
  status.isSyncing = true;
  tableStatuses.set(tableName, status);
  
  // Déclencher un événement de début de synchronisation
  window.dispatchEvent(new CustomEvent('sync-start', { detail: { table: tableName, userId } }));
  
  try {
    console.log(`Synchronisation de ${tableName} avec le serveur pour l'utilisateur ${userId}`);
    
    // Construire l'endpoint en fonction du nom de table
    const endpoint = `${tableName}-sync.php`;
    
    // Utiliser notre service d'API sécurisé
    const response = await securePost(endpoint, { 
      [tableName]: data, 
      userId 
    });
    
    if (response.success) {
      // Mise à jour du statut de synchronisation
      status.lastSynced = Date.now();
      status.hasError = false;
      status.errorMessage = null;
      status.hasPendingChanges = false;
      tableStatuses.set(tableName, status);
      
      // Déclencher un événement de succès de synchronisation
      window.dispatchEvent(new CustomEvent('sync-success', { 
        detail: { table: tableName, userId, timestamp: status.lastSynced } 
      }));
      
      return true;
    } else {
      throw new Error(response.message || "Erreur inconnue lors de la synchronisation");
    }
  } catch (error) {
    console.error(`Erreur lors de la synchronisation de ${tableName}:`, error);
    
    // Mise à jour du statut en cas d'erreur
    status.hasError = true;
    status.errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    tableStatuses.set(tableName, status);
    
    // Déclencher un événement d'erreur de synchronisation
    window.dispatchEvent(new CustomEvent('sync-error', { 
      detail: { table: tableName, userId, error: status.errorMessage } 
    }));
    
    return false;
  } finally {
    // Marquer la fin de la synchronisation
    status.isSyncing = false;
    tableStatuses.set(tableName, status);
    
    // Déclencher un événement de fin de synchronisation
    window.dispatchEvent(new CustomEvent('sync-completed', { 
      detail: { table: tableName, userId, success: !status.hasError } 
    }));
  }
};

// Fonctions pour récupérer les données du serveur
export const loadDataFromServer = async <T>(tableName: string, userId: string): Promise<T[]> => {
  // Valider que l'ID utilisateur est présent
  validateUserId();
  
  if (!userId) {
    throw new Error("ID utilisateur requis pour charger des données du serveur");
  }
  
  try {
    // Construire l'endpoint pour le chargement
    const endpoint = `${tableName}-load.php`;
    
    // Utiliser notre service d'API sécurisé
    const response = await secureGet(endpoint);
    
    if (response && response[tableName]) {
      // Sauvegarder localement les données récupérées
      saveLocalData(tableName, response[tableName], userId);
      
      // Marquer comme synchronisé
      const status = tableStatuses.get(tableName) || createDefaultStatus();
      status.lastSynced = Date.now();
      status.hasError = false;
      status.errorMessage = null;
      status.hasPendingChanges = false;
      tableStatuses.set(tableName, status);
      
      return response[tableName];
    } else {
      // Si la réponse n'a pas le format attendu
      console.warn(`Format de réponse inattendu pour ${tableName}:`, response);
      return [];
    }
  } catch (error) {
    console.error(`Erreur lors du chargement des données du serveur pour ${tableName}:`, error);
    
    // Mise à jour du statut en cas d'erreur
    const status = tableStatuses.get(tableName) || createDefaultStatus();
    status.hasError = true;
    status.errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    tableStatuses.set(tableName, status);
    
    // Fallback aux données locales en cas d'erreur
    console.log(`Utilisation des données locales pour ${tableName} (fallback)`);
    return loadLocalData<T>(tableName, userId);
  }
};

// Force la synchronisation de toutes les tables avec des modifications en attente
export const forceSync = async (userId: string): Promise<Record<string, boolean>> => {
  // Valider que l'ID utilisateur est présent
  validateUserId();
  
  if (!userId) {
    throw new Error("ID utilisateur requis pour forcer la synchronisation");
  }
  
  const results: Record<string, boolean> = {};
  
  // Parcourir toutes les tables et synchroniser celles avec des modifications en attente
  for (const [tableName, status] of tableStatuses.entries()) {
    if (status.hasPendingChanges) {
      const data = loadLocalData(tableName, userId);
      results[tableName] = await syncWithServer(tableName, data, userId);
    }
  }
  
  return results;
};

// Activer/désactiver la synchronisation automatique
let syncEnabled = true;
export const setSyncEnabled = (enabled: boolean): void => {
  syncEnabled = enabled;
};

// Vérifier si une table a des modifications en attente
export const hasPendingChanges = (tableName?: string, userId?: string): boolean => {
  if (!userId) {
    userId = validateUserId();
  }
  
  if (tableName) {
    const status = tableStatuses.get(tableName);
    return status ? status.hasPendingChanges : false;
  } else {
    // Vérifier toutes les tables
    for (const status of tableStatuses.values()) {
      if (status.hasPendingChanges) {
        return true;
      }
    }
    return false;
  }
};

// Obtenir la dernière date de synchronisation pour une table
export const getLastSynced = (tableName: string): number | null => {
  const status = tableStatuses.get(tableName);
  return status ? status.lastSynced : null;
};

// Créer un état de synchronisation par défaut
const createDefaultStatus = (): TableStatus => ({
  isSyncing: false,
  lastSynced: null,
  hasError: false,
  errorMessage: null,
  hasPendingChanges: false
});

// Pour la compatibilité avec le code existant
export function loadData<T>(tableName: string, userId: string): Promise<T[]> {
  // Toujours charger depuis le serveur, jamais depuis le stockage local uniquement
  return loadDataFromServer<T>(tableName, userId);
}

export function saveData<T>(tableName: string, data: T[], userId: string): void {
  // Sauvegarder localement et marquer pour synchronisation
  saveLocalData(tableName, data, userId);
  
  // Synchroniser immédiatement si possible
  if (navigator.onLine && syncEnabled) {
    syncWithServer(tableName, data, userId).catch(err => {
      console.error(`Erreur lors de la synchronisation automatique de ${tableName}:`, err);
    });
  }
}

// Hook pour la synchronisation automatique
export const useAutoSync = <T>(tableName: string, userId: string) => {
  // Valider que l'ID utilisateur est présent
  if (!userId) {
    userId = validateUserId();
  }

  const [data, setDataState] = React.useState<T[]>(() => loadLocalData<T>(tableName, userId || ''));
  const [isSyncing, setIsSyncing] = React.useState<boolean>(false);
  const [isOnline, setIsOnline] = React.useState<boolean>(navigator.onLine);
  const [lastSynced, setLastSynced] = React.useState<Date | null>(null);

  React.useEffect(() => {
    // Observer le statut en ligne
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Observer les événements de synchronisation
    const handleSyncStart = () => setIsSyncing(true);
    const handleSyncEnd = () => setIsSyncing(false);
    const handleSyncSuccess = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.table === tableName) {
        setLastSynced(new Date(customEvent.detail.timestamp));
      }
    };

    window.addEventListener('sync-start', handleSyncStart);
    window.addEventListener('sync-completed', handleSyncEnd);
    window.addEventListener('sync-success', handleSyncSuccess);

    // Chargement initial depuis le serveur
    if (userId) {
      loadDataFromServer<T>(tableName, userId).then(serverData => {
        setDataState(serverData);
        if (tableStatuses.get(tableName)?.lastSynced) {
          setLastSynced(new Date(tableStatuses.get(tableName)!.lastSynced!));
        }
      }).catch(console.error);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sync-start', handleSyncStart);
      window.removeEventListener('sync-completed', handleSyncEnd);
      window.removeEventListener('sync-success', handleSyncSuccess);
    };
  }, [tableName, userId]);

  // Fonction pour sauvegarder des données
  const setData = React.useCallback((newData: T[]) => {
    setDataState(newData);
    saveData<T>(tableName, newData, userId || '');
  }, [tableName, userId]);

  // Fonction pour forcer une synchronisation
  const syncWithServerWrapper = React.useCallback(async () => {
    if (!isOnline) return false;
    setIsSyncing(true);
    try {
      const result = await syncWithServer<T>(tableName, data, userId || '');
      if (result) {
        setLastSynced(new Date());
      }
      return result;
    } catch (error) {
      console.error(`Erreur lors de la synchronisation de ${tableName}:`, error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [tableName, data, userId, isOnline]);

  return {
    data,
    setData,
    isSyncing,
    isOnline,
    lastSynced,
    syncWithServer: syncWithServerWrapper,
    hasPendingChanges: () => hasPendingChanges(tableName, userId)
  };
};

// Initialisation des écouteurs d'événements pour la synchronisation automatique
let autoSyncInitialized = false;
export const initAutoSync = (): void => {
  if (autoSyncInitialized) return;
  
  console.log("AutoSync: Service de synchronisation initialisé");
  
  // Vérifier périodiquement les synchronisations en attente
  setInterval(() => {
    if (navigator.onLine && syncEnabled) {
      const userId = getCurrentUser();
      if (userId && document.visibilityState === 'visible') {
        console.log("AutoSync: Onglet actif, vérification des synchronisations en attente");
        forceSync(userId).catch(console.error);
      }
    }
  }, SYNC_INTERVAL);
  
  // Tenter de synchroniser quand la connexion est rétablie
  window.addEventListener('online', () => {
    if (syncEnabled) {
      console.log("AutoSync: Connexion rétablie, tentative de synchronisation");
      const userId = getCurrentUser();
      if (userId) {
        forceSync(userId).catch(console.error);
      }
    }
  });
  
  console.log(`AutoSync: Synchronisation automatique démarrée (intervalle: ${SYNC_INTERVAL/1000}s)`);
  autoSyncInitialized = true;
};

// Initialiser la synchronisation automatique
if (typeof window !== 'undefined') {
  initAutoSync();
}
