
/**
 * Gestionnaire de stockage pour la synchronisation
 */

const SYNC_STORAGE_PREFIX = 'app_sync_';

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
