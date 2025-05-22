
/**
 * Service Unifié de Synchronisation 
 * Gère toute la synchronisation des données entre les composants et avec le serveur
 */
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { toast } from '@/hooks/use-toast';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { v4 as uuidv4 } from 'uuid';

// Base de données fixe pour toutes les opérations
const FIXED_DB_USER = 'p71x6d_richard';

// Types de base
export interface SyncItem {
  id: string;
  date_creation?: Date;
  date_modification?: Date;
  [key: string]: any;
}

export type SyncTable = {
  name: string;
  data: SyncItem[];
  lastSynced?: Date;
  endpoint?: string;
};

export type SyncResult = {
  success: boolean;
  message: string;
  count?: number;
  timestamp?: string;
};

// Gestionnaire de cache local
const localCache = new Map<string, SyncTable>();

// État de synchronisation global
const syncState = {
  isSyncing: false,
  errors: new Map<string, string>(),
  lastSync: new Map<string, Date>(),
  pendingChanges: new Set<string>()
};

// Événements de synchronisation
export const syncEvents = {
  subscribe: (table: string, callback: (data: any) => void): (() => void) => {
    const eventName = `sync-${table}`;
    const handler = (e: CustomEvent) => callback(e.detail);
    
    window.addEventListener(eventName as any, handler as EventListener);
    return () => window.removeEventListener(eventName as any, handler as EventListener);
  },
  
  notify: (table: string, data: any) => {
    const event = new CustomEvent(`sync-${table}`, { detail: data });
    window.dispatchEvent(event);
  }
};

/**
 * Charge les données depuis le cache local
 */
export const loadFromCache = <T extends SyncItem>(table: string): T[] => {
  try {
    // Récupérer depuis la Map en mémoire d'abord
    const cachedTable = localCache.get(table);
    if (cachedTable) {
      return cachedTable.data as T[];
    }
    
    // Sinon chercher dans le localStorage
    const key = `data_${FIXED_DB_USER}_${table}`;
    const data = localStorage.getItem(key);
    if (!data) return [];
    
    const parsedData = JSON.parse(data) as T[];
    
    // Mettre à jour le cache en mémoire
    localCache.set(table, { name: table, data: parsedData });
    
    return parsedData;
  } catch (error) {
    console.error(`Erreur lors du chargement du cache pour ${table}:`, error);
    return [];
  }
};

/**
 * Sauvegarde les données dans le cache local
 */
export const saveToCache = <T extends SyncItem>(table: string, data: T[]): void => {
  try {
    // Sauvegarder dans la Map en mémoire
    localCache.set(table, { 
      name: table, 
      data: data,
      lastSynced: new Date()
    });
    
    // Sauvegarder dans le localStorage également
    const key = `data_${FIXED_DB_USER}_${table}`;
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(`${key}_timestamp`, new Date().toISOString());
    
    // Marquer comme ayant des changements en attente
    syncState.pendingChanges.add(table);
    
    // Notifier les composants abonnés
    syncEvents.notify(table, { action: 'update', data });
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde du cache pour ${table}:`, error);
  }
};

/**
 * Synchronise les données avec le serveur
 */
export const syncWithServer = async <T extends SyncItem>(
  table: string,
  data?: T[],
  endpoint?: string
): Promise<SyncResult> => {
  try {
    // Empêcher les synchronisations simultanées de la même table
    if (syncState.isSyncing) {
      return { success: false, message: "Synchronisation déjà en cours" };
    }
    
    syncState.isSyncing = true;
    
    console.log(`UnifiedSync: Synchronisation de ${table} avec le serveur`);
    
    // Si aucune donnée n'est fournie, utiliser le cache
    const dataToSync = data || loadFromCache<T>(table);
    
    // Déterminer le point d'entrée API
    const apiEndpoint = endpoint || `${table}-sync.php`;
    const apiUrl = getApiUrl();
    const syncUrl = `${apiUrl}/${apiEndpoint}`;
    
    console.log(`UnifiedSync: Envoi à ${syncUrl} avec ${dataToSync.length} éléments`);
    
    // Préparer les données pour l'envoi
    const syncData = {
      userId: FIXED_DB_USER,
      userPrefix: localStorage.getItem('userPrefix') || 'u1',
      originalUserId: localStorage.getItem('originalUserId') || getCurrentUser(),
      [table]: dataToSync,
      timestamp: new Date().toISOString()
    };
    
    // Faire la requête API
    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(syncData)
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Échec de la synchronisation');
    }
    
    // Mettre à jour l'état de synchronisation
    syncState.lastSync.set(table, new Date());
    syncState.errors.delete(table);
    syncState.pendingChanges.delete(table);
    
    // Notifier les composants
    syncEvents.notify(table, { 
      action: 'synced', 
      timestamp: new Date(),
      count: result.count || dataToSync.length
    });
    
    console.log(`UnifiedSync: Synchronisation réussie pour ${table}`);
    return {
      success: true,
      message: "Synchronisation réussie",
      count: result.count || dataToSync.length,
      timestamp: result.timestamp || new Date().toISOString()
    };
  } catch (error) {
    console.error(`UnifiedSync: Erreur lors de la synchronisation de ${table}:`, error);
    
    // Mettre à jour l'état d'erreur
    syncState.errors.set(table, error instanceof Error ? error.message : String(error));
    
    // Notifier les composants
    syncEvents.notify(table, { 
      action: 'error', 
      error: error instanceof Error ? error.message : String(error)
    });
    
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  } finally {
    syncState.isSyncing = false;
  }
};

/**
 * Récupère les données depuis le serveur
 */
export const fetchFromServer = async <T extends SyncItem>(
  table: string,
  endpoint?: string
): Promise<T[]> => {
  try {
    // Déterminer le point d'entrée API
    const apiEndpoint = endpoint || `${table}-sync.php`;
    const apiUrl = getApiUrl();
    const fetchUrl = `${apiUrl}/${apiEndpoint}?userId=${FIXED_DB_USER}`;
    
    console.log(`UnifiedSync: Récupération depuis ${fetchUrl}`);
    
    // Faire la requête API
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Échec de récupération');
    }
    
    // Extraire les données de la réponse
    const dataKey = table === 'exigences' ? 'exigences' : 
                    table === 'membres' ? 'membres' :
                    table === 'documents' ? 'documents' : table;
    
    const data = result[dataKey] || [];
    
    // Sauvegarder dans le cache
    saveToCache(table, data);
    
    // Mettre à jour l'état de synchronisation
    syncState.lastSync.set(table, new Date());
    
    // Notifier les composants
    syncEvents.notify(table, { 
      action: 'loaded', 
      data,
      timestamp: new Date()
    });
    
    return data as T[];
  } catch (error) {
    console.error(`UnifiedSync: Erreur lors de la récupération de ${table}:`, error);
    
    // En cas d'erreur, retourner les données du cache
    const cachedData = loadFromCache<T>(table);
    
    // Mettre à jour l'état d'erreur
    syncState.errors.set(table, error instanceof Error ? error.message : String(error));
    
    // Notifier les composants
    syncEvents.notify(table, { 
      action: 'error', 
      error: error instanceof Error ? error.message : String(error)
    });
    
    return cachedData;
  }
};

/**
 * Crée un nouvel élément
 */
export const createItem = <T extends SyncItem>(table: string, data: Partial<T> = {}): T => {
  // Récupérer les données actuelles
  const items = loadFromCache<T>(table);
  
  // Créer le nouvel élément
  const newItem = {
    id: data.id || uuidv4(),
    date_creation: new Date(),
    date_modification: new Date(),
    ...data
  } as T;
  
  // Ajouter à la liste
  items.push(newItem);
  
  // Sauvegarder dans le cache
  saveToCache(table, items);
  
  // Notifier les composants
  syncEvents.notify(table, { 
    action: 'create', 
    item: newItem
  });
  
  return newItem;
};

/**
 * Met à jour un élément existant
 */
export const updateItem = <T extends SyncItem>(table: string, id: string, data: Partial<T>): T | null => {
  // Récupérer les données actuelles
  const items = loadFromCache<T>(table);
  
  // Trouver l'élément
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return null;
  
  // Mettre à jour l'élément
  const updatedItem = {
    ...items[index],
    ...data,
    date_modification: new Date()
  } as T;
  
  items[index] = updatedItem;
  
  // Sauvegarder dans le cache
  saveToCache(table, items);
  
  // Notifier les composants
  syncEvents.notify(table, { 
    action: 'update', 
    item: updatedItem
  });
  
  return updatedItem;
};

/**
 * Supprime un élément
 */
export const deleteItem = <T extends SyncItem>(table: string, id: string): boolean => {
  // Récupérer les données actuelles
  const items = loadFromCache<T>(table);
  
  // Trouver l'élément
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return false;
  
  // Supprimer l'élément
  const deletedItem = items[index];
  items.splice(index, 1);
  
  // Sauvegarder dans le cache
  saveToCache(table, items);
  
  // Notifier les composants
  syncEvents.notify(table, { 
    action: 'delete', 
    item: deletedItem
  });
  
  return true;
};

/**
 * Réorganise les éléments
 */
export const reorderItems = <T extends SyncItem>(
  table: string, 
  startIndex: number, 
  endIndex: number,
  groupId?: string
): boolean => {
  // Récupérer les données actuelles
  const allItems = loadFromCache<T>(table);
  
  // Si un groupId est spécifié, ne réorganiser que les éléments de ce groupe
  const items = groupId 
    ? allItems.filter(item => item.groupId === groupId)
    : allItems.filter(item => !item.groupId);
  
  if (startIndex < 0 || startIndex >= items.length ||
      endIndex < 0 || endIndex >= items.length) {
    return false;
  }
  
  // Déplacer l'élément
  const [removed] = items.splice(startIndex, 1);
  items.splice(endIndex, 0, removed);
  
  // Mettre à jour l'ordre
  items.forEach((item, index) => {
    item.ordre = index + 1;
  });
  
  // Si un groupId est spécifié, mettre à jour uniquement les éléments de ce groupe
  if (groupId) {
    const updatedItems = [
      ...allItems.filter(item => item.groupId !== groupId),
      ...items
    ];
    saveToCache(table, updatedItems);
  } else {
    const updatedItems = [
      ...allItems.filter(item => item.groupId),
      ...items
    ];
    saveToCache(table, updatedItems);
  }
  
  // Notifier les composants
  syncEvents.notify(table, { 
    action: 'reorder', 
    startIndex, 
    endIndex, 
    groupId
  });
  
  return true;
};

/**
 * Récupère l'état de synchronisation
 */
export const getSyncState = (table: string) => {
  return {
    isSyncing: syncState.isSyncing,
    hasError: syncState.errors.has(table),
    errorMessage: syncState.errors.get(table),
    lastSynced: syncState.lastSync.get(table),
    hasPendingChanges: syncState.pendingChanges.has(table)
  };
};

/**
 * Récupère un élément par son ID
 */
export const getItemById = <T extends SyncItem>(table: string, id: string): T | null => {
  const items = loadFromCache<T>(table);
  return items.find(item => item.id === id) || null;
};

// Exporter le service unifié
export const unifiedSyncService = {
  loadFromCache,
  saveToCache,
  syncWithServer,
  fetchFromServer,
  createItem,
  updateItem,
  deleteItem,
  reorderItems,
  getSyncState,
  getItemById,
  events: syncEvents
};

export default unifiedSyncService;
