
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
      
      // Sauvegarder dans localStorage pour persistance entre sessions
      localStorage.setItem(storageKey, jsonData);
      
      // NOUVEAU: Sauvegarder également dans sessionStorage pour persistance entre pages
      sessionStorage.setItem(storageKey, jsonData);
      
      // NOUVEAU: Enregistrer l'horodatage de la dernière sauvegarde
      const timestamp = new Date().toISOString();
      localStorage.setItem(`${storageKey}_last_saved`, timestamp);
      sessionStorage.setItem(`${storageKey}_last_saved`, timestamp);
      
      // NOUVEAU: Vérifier que les données ont bien été sauvegardées
      const verifyLocalStorage = localStorage.getItem(storageKey);
      const verifySessionStorage = sessionStorage.getItem(storageKey);
      
      if (!verifyLocalStorage || !verifySessionStorage) {
        console.warn(`SyncStorageManager: Vérification de sauvegarde échouée pour ${tableName}. Nouvel essai...`);
        
        // Nouvelle tentative avec une taille réduite si les données sont trop volumineuses
        if (jsonData.length > 1000000) { // ~1MB
          console.warn(`SyncStorageManager: Les données pour ${tableName} sont très volumineuses (${jsonData.length} caractères). Tentative de compression...`);
          
          // Essayer de stocker sans les propriétés non essentielles si possible
          try {
            const simplifiedData = data.map((item: any) => {
              // Créer une copie simplifiée de chaque élément
              const copy: any = { ...item };
              
              // Supprimer les propriétés volumineuses non essentielles si elles existent
              const nonEssentialProps = ['description', 'details', 'comments', 'history', 'fullContent'];
              nonEssentialProps.forEach(prop => {
                if (prop in copy && typeof copy[prop] === 'string' && copy[prop].length > 1000) {
                  copy[prop] = `${copy[prop].substring(0, 500)}... [tronqué]`;
                }
              });
              
              return copy;
            });
            
            const simplifiedJson = JSON.stringify(simplifiedData);
            localStorage.setItem(`${storageKey}_simplified`, simplifiedJson);
            sessionStorage.setItem(`${storageKey}_simplified`, simplifiedJson);
            console.warn(`SyncStorageManager: Données simplifiées sauvegardées pour ${tableName}`);
          } catch (simplifyError) {
            console.error(`SyncStorageManager: Échec de simplification pour ${tableName}:`, simplifyError);
          }
        }
      }
      
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
      
      // Si toujours rien, essayer la version simplifiée
      if (!localData) {
        localData = sessionStorage.getItem(`${storageKey}_simplified`);
        if (localData) source = "sessionStorage (simplified)";
        
        if (!localData) {
          localData = localStorage.getItem(`${storageKey}_simplified`);
          if (localData) source = "localStorage (simplified)";
        }
      }
    }
    
    if (localData) {
      try {
        const parsedData = JSON.parse(localData);
        if (Array.isArray(parsedData)) {
          console.log(`SyncStorageManager: ${parsedData.length} éléments chargés depuis ${source} pour ${tableName}`);
          
          // NOUVEAU: Si les données viennent de localStorage, les sauvegarder dans sessionStorage
          if (source.startsWith("localStorage")) {
            try {
              sessionStorage.setItem(storageKey, localData);
              console.log(`SyncStorageManager: Données copiées dans sessionStorage pour ${tableName}`);
            } catch (sessionError) {
              console.warn(`SyncStorageManager: Impossible de copier dans sessionStorage pour ${tableName}:`, sessionError);
            }
          }
          
          return parsedData;
        } else {
          console.warn(`SyncStorageManager: Les données pour ${tableName} ne sont pas un tableau`);
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
            sessionStorage.setItem(key, data);
            if (localTimestamp) {
              sessionStorage.setItem(localTimestampKey, localTimestamp);
            }
            console.log(`SyncStorageManager: Données de "${key}" mises à jour dans sessionStorage`);
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
            localStorage.setItem(key, data);
            if (sessionTimestamp) {
              localStorage.setItem(sessionTimestampKey, sessionTimestamp);
            }
            console.log(`SyncStorageManager: Données de "${key}" mises à jour dans localStorage`);
          }
        }
      }
    }
  } catch (error) {
    console.error("SyncStorageManager: Erreur lors de la synchronisation entre storages:", error);
  }
};

// NOUVEAU: Fonction plus agressive pour se prémunir contre la perte de données
export const forceSessionPersistence = (tableName: string, syncKey?: string): void => {
  try {
    const storageKey = getStorageKey(tableName, syncKey);
    const localData = localStorage.getItem(storageKey);
    const sessionData = sessionStorage.getItem(storageKey);
    
    // Déterminer quelles sont les données les plus récentes
    const localTimestamp = localStorage.getItem(`${storageKey}_last_saved`);
    const sessionTimestamp = sessionStorage.getItem(`${storageKey}_last_saved`);
    
    let mostRecentData: string | null = null;
    let source = "";
    
    if (localTimestamp && sessionTimestamp) {
      // Les deux existent, prendre le plus récent
      if (new Date(localTimestamp) > new Date(sessionTimestamp)) {
        mostRecentData = localData;
        source = "localStorage";
      } else {
        mostRecentData = sessionData;
        source = "sessionStorage";
      }
    } else if (localData) {
      // Seulement dans localStorage
      mostRecentData = localData;
      source = "localStorage";
    } else if (sessionData) {
      // Seulement dans sessionStorage
      mostRecentData = sessionData;
      source = "sessionStorage";
    }
    
    // Si des données ont été trouvées, les enregistrer dans les deux stockages
    if (mostRecentData) {
      const timestamp = new Date().toISOString();
      
      localStorage.setItem(storageKey, mostRecentData);
      localStorage.setItem(`${storageKey}_last_saved`, timestamp);
      
      sessionStorage.setItem(storageKey, mostRecentData);
      sessionStorage.setItem(`${storageKey}_last_saved`, timestamp);
      
      console.log(`SyncStorageManager: Force persistence - données de ${source} copiées dans les deux stockages pour ${tableName}`);
      return;
    }
    
    console.log(`SyncStorageManager: Aucune donnée trouvée pour ${tableName}`);
  } catch (error) {
    console.error(`SyncStorageManager: Erreur lors de forceSessionPersistence pour ${tableName}:`, error);
  }
};

// Exécuter le nettoyage et la synchronisation au chargement
cleanupMalformedData();
syncBetweenStorages();

// NOUVEAU: Ajouter un événement pour synchroniser les storages lors du focus sur la fenêtre et avant de quitter
if (typeof window !== 'undefined') {
  // Synchroniser lorsque l'utilisateur revient sur l'onglet
  window.addEventListener('focus', syncBetweenStorages);
  
  // Synchroniser avant que l'utilisateur ne quitte la page
  window.addEventListener('beforeunload', () => {
    syncBetweenStorages();
    console.log("SyncStorageManager: Synchronisation finalisée avant départ de la page");
  });
  
  // Synchroniser lorsque l'utilisateur change de page dans l'application (routing)
  window.addEventListener('popstate', () => {
    syncBetweenStorages();
    console.log("SyncStorageManager: Synchronisation lors du changement de page");
  });
}

export { markPendingSync, clearPendingSync, hasPendingSync, hasLocalData, getLastSavedTimestamp };
