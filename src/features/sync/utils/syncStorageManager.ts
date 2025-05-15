
/**
 * Gestionnaire de stockage pour la synchronisation
 */

const SYNC_STORAGE_PREFIX = 'app_sync_';

// Fonctions de base pour le stockage de synchronisation
export const saveSyncData = <T>(key: string, data: T): void => {
  try {
    const storageKey = `${SYNC_STORAGE_PREFIX}${key}`;
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (error) {
    console.error(`Erreur lors de l'enregistrement des données de synchronisation pour ${key}:`, error);
  }
};

export const loadSyncData = <T>(key: string): T | null => {
  try {
    const storageKey = `${SYNC_STORAGE_PREFIX}${key}`;
    const data = localStorage.getItem(storageKey);
    
    if (data) {
      return JSON.parse(data) as T;
    }
  } catch (error) {
    console.error(`Erreur lors du chargement des données de synchronisation pour ${key}:`, error);
  }
  
  return null;
};

export const removeSyncData = (key: string): void => {
  try {
    const storageKey = `${SYNC_STORAGE_PREFIX}${key}`;
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error(`Erreur lors de la suppression des données de synchronisation pour ${key}:`, error);
  }
};

// Fonctions spécifiques pour la compatibilité avec le code existant
export const saveLocalData = <T>(tableName: string, data: T, userId: string | null = null): void => {
  try {
    const key = userId ? `${tableName}_${userId}` : tableName;
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Erreur lors de l'enregistrement des données locales pour ${tableName}:`, error);
  }
};

export const loadLocalData = <T>(tableName: string, userId: string | null = null): T[] => {
  try {
    const key = userId ? `${tableName}_${userId}` : tableName;
    const data = localStorage.getItem(key);
    
    if (data) {
      return JSON.parse(data) as T[];
    }
  } catch (error) {
    console.error(`Erreur lors du chargement des données locales pour ${tableName}:`, error);
  }
  
  return [];
};

export const markPendingSync = (tableName: string): void => {
  try {
    localStorage.setItem(`${tableName}_pending_sync`, 'true');
  } catch (error) {
    console.error(`Erreur lors du marquage de synchronisation en attente pour ${tableName}:`, error);
  }
};

export const clearPendingSync = (tableName: string): void => {
  try {
    localStorage.removeItem(`${tableName}_pending_sync`);
  } catch (error) {
    console.error(`Erreur lors de la suppression du marquage de synchronisation pour ${tableName}:`, error);
  }
};

export const hasLocalData = (tableName: string): boolean => {
  try {
    const data = localStorage.getItem(tableName);
    return !!data && data !== '[]' && data !== '{}';
  } catch (error) {
    console.error(`Erreur lors de la vérification des données locales pour ${tableName}:`, error);
  }
  
  return false;
};

export const cleanupMalformedData = (tableName: string): void => {
  try {
    const allKeys = Object.keys(localStorage);
    
    for (const key of allKeys) {
      if (key.startsWith(tableName)) {
        const data = localStorage.getItem(key);
        
        if (!data || data === 'undefined' || data === 'null') {
          localStorage.removeItem(key);
          console.log(`Suppression des données malformées pour ${key}`);
        }
      }
    }
  } catch (error) {
    console.error(`Erreur lors du nettoyage des données malformées pour ${tableName}:`, error);
  }
};

export const getAllSyncKeys = (): string[] => {
  const keys: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    
    if (key && key.startsWith(SYNC_STORAGE_PREFIX)) {
      keys.push(key.substring(SYNC_STORAGE_PREFIX.length));
    }
  }
  
  return keys;
};

export const clearAllSyncData = (): void => {
  const keysToRemove = getAllSyncKeys();
  
  for (const key of keysToRemove) {
    removeSyncData(key);
  }
};
