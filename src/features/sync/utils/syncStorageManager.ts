
/**
 * Utility for managing data storage during synchronization
 */

import { getCurrentUser } from '@/services/core/databaseConnectionService';

// Generate a unique storage key for a table
export const getStorageKey = (tableName: string, syncKey?: string): string => {
  const userId = getCurrentUser() || 'default';
  // S'assurer que la clé est une chaîne valide
  const safeTableName = typeof tableName === 'string' ? tableName : String(tableName);
  const safeSyncKey = syncKey && typeof syncKey === 'string' ? syncKey : '';
  
  return safeSyncKey ? 
    `${safeTableName}_${safeSyncKey}_${userId}` : 
    `${safeTableName}_${userId}`;
};

// Save data to local storage and session storage for redundancy
export const saveLocalData = <T>(tableName: string, data: T[], syncKey?: string): void => {
  try {
    // S'assurer que tableName est une chaîne valide
    if (!tableName || typeof tableName !== 'string') {
      console.error(`SyncStorageManager: Nom de table invalide: ${tableName}`);
      return;
    }
    
    const storageKey = getStorageKey(tableName, syncKey);
    
    // Vérifier si la clé est valide
    if (!storageKey || typeof storageKey !== 'string') {
      console.error(`SyncStorageManager: Clé de stockage invalide: ${storageKey}`);
      return;
    }
    
    // S'assurer que les données sont valides
    if (data === undefined || data === null) {
      console.error(`SyncStorageManager: Données invalides pour ${tableName}`);
      return;
    }
    
    try {
      // Essayer de convertir en JSON
      const jsonData = JSON.stringify(data);
      
      // Vérifier la validité du JSON (parse test)
      try {
        JSON.parse(jsonData);
      } catch (parseError) {
        console.error(`SyncStorageManager: Les données pour ${tableName} ne sont pas valides pour JSON:`, parseError);
        return;
      }
      
      // Nettoyer les anciennes entrées potentiellement corrompues
      try {
        localStorage.removeItem(storageKey);
        sessionStorage.removeItem(storageKey);
        localStorage.removeItem(`${storageKey}_last_saved`);
        sessionStorage.removeItem(`${storageKey}_last_saved`);
      } catch (cleanError) {
        console.warn(`SyncStorageManager: Erreur lors du nettoyage des anciennes entrées:`, cleanError);
      }
      
      // Sauvegarder dans localStorage pour persistance entre sessions
      localStorage.setItem(storageKey, jsonData);
      
      // NOUVEAU: Sauvegarder également dans sessionStorage pour persistance entre pages
      sessionStorage.setItem(storageKey, jsonData);
      
      // NOUVEAU: Enregistrer l'horodatage de la dernière sauvegarde
      const timestamp = new Date().toISOString();
      localStorage.setItem(`${storageKey}_last_saved`, timestamp);
      sessionStorage.setItem(`${storageKey}_last_saved`, timestamp);
      
      console.log(`SyncStorageManager: ${data.length} éléments sauvegardés pour ${tableName} (${timestamp})`);
    } catch (jsonError) {
      console.error(`SyncStorageManager: Erreur de conversion JSON pour ${tableName}:`, jsonError);
    }
  } catch (error) {
    console.error(`SyncStorageManager: Erreur lors de la sauvegarde des données pour ${tableName}:`, error);
  }
};

// Load data with priority order: sessionStorage > localStorage
export const loadLocalData = <T>(tableName: string, syncKey?: string): T[] => {
  try {
    // S'assurer que tableName est une chaîne valide
    if (!tableName || typeof tableName !== 'string') {
      console.error(`SyncStorageManager: Nom de table invalide pour chargement: ${tableName}`);
      return [];
    }
    
    const storageKey = getStorageKey(tableName, syncKey);
    
    // Vérifier si la clé est valide
    if (!storageKey || typeof storageKey !== 'string') {
      console.error(`SyncStorageManager: Clé de stockage invalide pour chargement: ${storageKey}`);
      return [];
    }
    
    // NOUVEAU: D'abord essayer de charger depuis sessionStorage (plus récent)
    let localData = sessionStorage.getItem(storageKey);
    let source = "sessionStorage";
    
    // Si pas de données dans sessionStorage, essayer localStorage
    if (!localData) {
      localData = localStorage.getItem(storageKey);
      source = "localStorage";
    }
    
    if (localData) {
      try {
        // Vérifier si les données commencent par [ ou { (format JSON valide)
        if (!localData.trim().startsWith('[') && !localData.trim().startsWith('{')) {
          console.warn(`SyncStorageManager: Données corrompues pour ${tableName} dans ${source}, suppression...`);
          localStorage.removeItem(storageKey);
          sessionStorage.removeItem(storageKey);
          return [];
        }
        
        const parsedData = JSON.parse(localData);
        if (Array.isArray(parsedData)) {
          console.log(`SyncStorageManager: ${parsedData.length} éléments chargés depuis ${source} pour ${tableName}`);
          return parsedData;
        } else {
          console.warn(`SyncStorageManager: Les données pour ${tableName} ne sont pas un tableau`);
          // Tenter de nettoyer les données corrompues
          localStorage.removeItem(storageKey);
          sessionStorage.removeItem(storageKey);
          return [];
        }
      } catch (parseError) {
        console.error(`SyncStorageManager: Erreur lors de l'analyse JSON pour ${tableName}:`, parseError);
        // Supprimer les données corrompues
        localStorage.removeItem(storageKey);
        sessionStorage.removeItem(storageKey);
        return [];
      }
    }
  } catch (error) {
    console.error(`SyncStorageManager: Erreur lors du chargement des données pour ${tableName}:`, error);
  }
  return [];
};

// Mark a table as having pending changes
export const markPendingSync = (tableName: string): void => {
  try {
    // S'assurer que tableName est une chaîne valide
    if (!tableName || typeof tableName !== 'string') {
      console.error(`SyncStorageManager: Nom de table invalide pour marquage: ${tableName}`);
      return;
    }
    
    const timestamp = Date.now().toString();
    localStorage.setItem(`pending_sync_${tableName}`, timestamp);
    sessionStorage.setItem(`pending_sync_${tableName}`, timestamp);
  } catch (error) {
    console.error(`SyncStorageManager: Erreur lors du marquage pour synchronisation pour ${tableName}:`, error);
  }
};

// Remove pending sync marker
export const clearPendingSync = (tableName: string): void => {
  try {
    // S'assurer que tableName est une chaîne valide
    if (!tableName || typeof tableName !== 'string') {
      console.error(`SyncStorageManager: Nom de table invalide pour nettoyage: ${tableName}`);
      return;
    }
    
    localStorage.removeItem(`pending_sync_${tableName}`);
    sessionStorage.removeItem(`pending_sync_${tableName}`);
  } catch (error) {
    console.error(`SyncStorageManager: Erreur lors de la suppression du marqueur pour ${tableName}:`, error);
  }
};

// Check if a table has pending changes
export const hasPendingSync = (tableName: string): boolean => {
  if (!tableName || typeof tableName !== 'string') {
    console.error(`SyncStorageManager: Nom de table invalide pour vérification: ${tableName}`);
    return false;
  }
  return localStorage.getItem(`pending_sync_${tableName}`) !== null || 
         sessionStorage.getItem(`pending_sync_${tableName}`) !== null;
};

// NOUVEAU: Vérifier si les données existent pour une table
export const hasLocalData = (tableName: string, syncKey?: string): boolean => {
  const storageKey = getStorageKey(tableName, syncKey);
  return sessionStorage.getItem(storageKey) !== null || localStorage.getItem(storageKey) !== null;
};

// NOUVEAU: Obtenir l'horodatage de la dernière sauvegarde
export const getLastSavedTimestamp = (tableName: string, syncKey?: string): Date | null => {
  try {
    const storageKey = getStorageKey(tableName, syncKey);
    const sessionTimestamp = sessionStorage.getItem(`${storageKey}_last_saved`);
    const localTimestamp = localStorage.getItem(`${storageKey}_last_saved`);
    
    if (sessionTimestamp) {
      return new Date(sessionTimestamp);
    } else if (localTimestamp) {
      return new Date(localTimestamp);
    }
  } catch (error) {
    console.error(`SyncStorageManager: Erreur lors de la récupération de l'horodatage pour ${tableName}:`, error);
  }
  return null;
};

// Nettoyage des entrées malformées dans le localStorage ET sessionStorage
export const cleanupMalformedData = (): void => {
  try {
    console.log("SyncStorageManager: Nettoyage des données malformées");
    
    // Fonction de nettoyage réutilisable
    const cleanStorage = (storage: Storage, name: string) => {
      const keys = Object.keys(storage);
      let cleanedCount = 0;
      
      for (const key of keys) {
        // Vérifier si la clé contient [object Object]
        if (key.includes('[object Object]')) {
          console.log(`Suppression de l'entrée malformée dans ${name}: ${key}`);
          storage.removeItem(key);
          cleanedCount++;
          continue;
        }
        
        // Vérifier si les données JSON sont valides
        try {
          const data = storage.getItem(key);
          if (data && (data.startsWith('{') || data.startsWith('['))) {
            JSON.parse(data);
          } else if (data && key.includes('_last_saved')) {
            // Vérifier si c'est une date valide
            new Date(data);
          } else if (data) {
            // Si ce n'est pas un JSON valide et pas un timestamp, supprimer
            console.log(`Suppression de l'entrée non-JSON dans ${name}: ${key}`);
            storage.removeItem(key);
            cleanedCount++;
          }
        } catch (e) {
          console.log(`Suppression de l'entrée avec JSON invalide dans ${name}: ${key}`);
          storage.removeItem(key);
          cleanedCount++;
        }
      }
      
      return cleanedCount;
    };
    
    // Nettoyer localStorage et sessionStorage
    const cleanedLocal = cleanStorage(localStorage, 'localStorage');
    const cleanedSession = cleanStorage(sessionStorage, 'sessionStorage');
    
    console.log(`SyncStorageManager: ${cleanedLocal} entrées malformées nettoyées dans localStorage`);
    console.log(`SyncStorageManager: ${cleanedSession} entrées malformées nettoyées dans sessionStorage`);
  } catch (error) {
    console.error("SyncStorageManager: Erreur lors du nettoyage des données malformées:", error);
  }
};

// NOUVEAU: Synchroniser entre localStorage et sessionStorage
export const syncBetweenStorages = (): void => {
  try {
    console.log("SyncStorageManager: Synchronisation entre localStorage et sessionStorage");
    
    const localKeys = Object.keys(localStorage);
    const sessionKeys = Object.keys(sessionStorage);
    
    // Copier les données plus récentes de localStorage vers sessionStorage
    for (const key of localKeys) {
      if (!key.includes('_last_saved')) {
        const localTimestampKey = `${key}_last_saved`;
        const localTimestamp = localStorage.getItem(localTimestampKey);
        const sessionTimestamp = sessionStorage.getItem(localTimestampKey);
        
        // Si les données de localStorage sont plus récentes ou si sessionStorage n'a pas ces données
        if (!sessionStorage.getItem(key) || 
            (localTimestamp && sessionTimestamp && new Date(localTimestamp) > new Date(sessionTimestamp))) {
          const data = localStorage.getItem(key);
          if (data) {
            // Vérifier si c'est du JSON valide avant de copier
            try {
              if (data.startsWith('[') || data.startsWith('{')) {
                JSON.parse(data);
                sessionStorage.setItem(key, data);
                if (localTimestamp) {
                  sessionStorage.setItem(localTimestampKey, localTimestamp);
                }
                console.log(`SyncStorageManager: Données de "${key}" mises à jour dans sessionStorage`);
              }
            } catch (e) {
              console.log(`SyncStorageManager: Données invalides non copiées pour "${key}"`);
            }
          }
        }
      }
    }
    
    // Copier les données plus récentes de sessionStorage vers localStorage
    for (const key of sessionKeys) {
      if (!key.includes('_last_saved')) {
        const sessionTimestampKey = `${key}_last_saved`;
        const sessionTimestamp = sessionStorage.getItem(sessionTimestampKey);
        const localTimestamp = localStorage.getItem(sessionTimestampKey);
        
        // Si les données de sessionStorage sont plus récentes ou si localStorage n'a pas ces données
        if (!localStorage.getItem(key) || 
            (sessionTimestamp && localTimestamp && new Date(sessionTimestamp) > new Date(localTimestamp))) {
          const data = sessionStorage.getItem(key);
          if (data) {
            // Vérifier si c'est du JSON valide avant de copier
            try {
              if (data.startsWith('[') || data.startsWith('{')) {
                JSON.parse(data);
                localStorage.setItem(key, data);
                if (sessionTimestamp) {
                  localStorage.setItem(sessionTimestampKey, sessionTimestamp);
                }
                console.log(`SyncStorageManager: Données de "${key}" mises à jour dans localStorage`);
              }
            } catch (e) {
              console.log(`SyncStorageManager: Données invalides non copiées pour "${key}"`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("SyncStorageManager: Erreur lors de la synchronisation entre storages:", error);
  }
};

// Fonction pour nettoyer complètement toutes les données de synchronisation
export const clearAllSyncData = (): void => {
  try {
    console.log("SyncStorageManager: Nettoyage complet des données de synchronisation");
    
    // Fonction pour nettoyer un storage
    const clearSyncData = (storage: Storage, name: string) => {
      const keys = Object.keys(storage);
      let clearedCount = 0;
      
      const syncRelatedKeys = keys.filter(key => 
        key.includes('_last_saved') || 
        key.includes('pending_sync_') || 
        key.includes('membres_') || 
        key.includes('documents_') || 
        key.includes('collaboration_')
      );
      
      for (const key of syncRelatedKeys) {
        storage.removeItem(key);
        clearedCount++;
      }
      
      return clearedCount;
    };
    
    // Nettoyer localStorage et sessionStorage
    const clearedLocal = clearSyncData(localStorage, 'localStorage');
    const clearedSession = clearSyncData(sessionStorage, 'sessionStorage');
    
    console.log(`SyncStorageManager: ${clearedLocal} entrées de synchronisation nettoyées dans localStorage`);
    console.log(`SyncStorageManager: ${clearedSession} entrées de synchronisation nettoyées dans sessionStorage`);
  } catch (error) {
    console.error("SyncStorageManager: Erreur lors du nettoyage complet des données:", error);
  }
};

// Exécuter le nettoyage et la synchronisation au chargement
cleanupMalformedData();
syncBetweenStorages();

// NOUVEAU: Ajouter un événement pour synchroniser les storages lors du focus sur la fenêtre
// Cela permet de synchroniser les données après être revenu sur l'onglet
if (typeof window !== 'undefined') {
  window.addEventListener('focus', syncBetweenStorages);
}
