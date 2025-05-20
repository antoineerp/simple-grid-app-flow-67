
/**
 * Utility for managing data storage during synchronization
 */

import { getCurrentUser } from '@/services/core/databaseConnectionService';

// Fonction pour obtenir un identifiant utilisateur valide
const getValidUserId = (user: any): string => {
  if (!user) return 'default';
  
  // Si c'est une chaîne, l'utiliser directement
  if (typeof user === 'string') return user;
  
  // Si c'est un objet, essayer d'extraire un identifiant
  if (typeof user === 'object' && user !== null) {
    // Essayer d'extraire des identifiants courants
    if ('identifiant_technique' in user && typeof user.identifiant_technique === 'string') {
      return user.identifiant_technique;
    }
    if ('email' in user && typeof user.email === 'string') {
      return user.email;
    }
    if ('id' in user && typeof user.id === 'string') {
      return user.id;
    }
    
    // Générer un identifiant unique basé sur un timestamp
    console.warn("Aucun identifiant valide trouvé dans l'objet utilisateur:", user);
    return `user_${Date.now().toString(36)}`;
  }
  
  return 'default';
};

// Generate a unique storage key for a table
export const getStorageKey = (tableName: string, syncKey?: string): string => {
  const currentUserObj = getCurrentUser();
  const userId = getValidUserId(currentUserObj);
  
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
      
      // Sauvegarder également dans sessionStorage pour persistance entre pages
      sessionStorage.setItem(storageKey, jsonData);
      
      // Enregistrer l'horodatage de la dernière sauvegarde
      const timestamp = new Date().toISOString();
      localStorage.setItem(`${storageKey}_last_saved`, timestamp);
      sessionStorage.setItem(`${storageKey}_last_saved`, timestamp);
      
      // Vérifier que les données ont bien été sauvegardées
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
    
    // D'abord essayer de charger depuis sessionStorage (plus récent)
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
          return parsedData;
        } else {
          console.warn(`SyncStorageManager: Les données pour ${tableName} ne sont pas un tableau`);
          return [];
        }
      } catch (jsonError) {
        console.error(`SyncStorageManager: Erreur de parsing JSON pour ${tableName}:`, jsonError);
        return [];
      }
    } else {
      console.log(`SyncStorageManager: Aucune donnée trouvée pour ${tableName}`);
      return [];
    }
  } catch (error) {
    console.error(`SyncStorageManager: Erreur lors du chargement des données pour ${tableName}:`, error);
    return [];
  }
};

// Marquer une table comme en attente de synchronisation
export const markPendingSync = (tableName: string): void => {
  try {
    localStorage.setItem(`sync_pending_${tableName}`, new Date().toISOString());
    
    // Émettre un événement pour notifier les autres parties de l'application
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sync-pending', { 
        detail: { tableName, timestamp: new Date().toISOString() }
      }));
    }
  } catch (error) {
    console.error(`SyncStorageManager: Erreur lors du marquage de sync en attente pour ${tableName}:`, error);
  }
};

// Supprimer le marqueur de synchronisation en attente
export const clearPendingSync = (tableName: string): void => {
  try {
    localStorage.removeItem(`sync_pending_${tableName}`);
    
    // Émettre un événement pour notifier les autres parties de l'application
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sync-completed', { 
        detail: { tableName, timestamp: new Date().toISOString() }
      }));
    }
  } catch (error) {
    console.error(`SyncStorageManager: Erreur lors de la suppression du marqueur de sync pour ${tableName}:`, error);
  }
};

// Vérifier si une table a une synchronisation en attente
export const hasPendingSync = (tableName: string): boolean => {
  try {
    return localStorage.getItem(`sync_pending_${tableName}`) !== null;
  } catch (error) {
    console.error(`SyncStorageManager: Erreur lors de la vérification du statut de sync pour ${tableName}:`, error);
    return false;
  }
};

// Vérifier si des données locales existent pour une table
export const hasLocalData = (tableName: string, syncKey?: string): boolean => {
  const storageKey = getStorageKey(tableName, syncKey);
  return localStorage.getItem(storageKey) !== null || 
         sessionStorage.getItem(storageKey) !== null ||
         localStorage.getItem(`${storageKey}_simplified`) !== null ||
         sessionStorage.getItem(`${storageKey}_simplified`) !== null;
};

// Obtenir la date de la dernière sauvegarde
export const getLastSavedTimestamp = (tableName: string, syncKey?: string): Date | null => {
  try {
    const storageKey = getStorageKey(tableName, syncKey);
    const timestamp = sessionStorage.getItem(`${storageKey}_last_saved`) || 
                     localStorage.getItem(`${storageKey}_last_saved`);
    
    if (timestamp) {
      return new Date(timestamp);
    }
    return null;
  } catch (error) {
    console.error(`SyncStorageManager: Erreur lors de la récupération de l'horodatage pour ${tableName}:`, error);
    return null;
  }
};

// Fonctions pour nettoyer les données erronées ou corrompues dans localStorage
export const cleanupLocalStorage = (): void => {
  try {
    const keys = Object.keys(localStorage);
    
    // Nettoyage des entrées potentiellement corrompues
    keys.forEach(key => {
      try {
        // Vérifier si la clé contient [object Object]
        if (key.includes('[object Object]')) {
          console.log(`SyncStorageManager: Suppression de l'entrée malformée dans localStorage: ${key}`);
          localStorage.removeItem(key);
        }
        
        // Essayer de lire la valeur pour détecter les erreurs JSON
        const value = localStorage.getItem(key);
        if (value) {
          // Si la clé semble être une clé de données JSON, essayer de l'analyser
          if (key.includes('_') && !key.startsWith('sync_') && !key.endsWith('_last_saved')) {
            JSON.parse(value);
          }
        }
      } catch (e) {
        // Si une erreur se produit lors de l'analyse, supprimer l'entrée corrompue
        console.error(`SyncStorageManager: Entrée corrompue détectée dans localStorage: ${key}. Suppression.`, e);
        localStorage.removeItem(key);
      }
    });
    
    console.log(`SyncStorageManager: Nettoyage de localStorage terminé`);
  } catch (error) {
    console.error(`SyncStorageManager: Erreur lors du nettoyage de localStorage:`, error);
  }
};

// Synchroniser les données entre localStorage et sessionStorage au chargement de la page
export const syncStorages = (): void => {
  try {
    const localStorageKeys = Object.keys(localStorage);
    const sessionStorageKeys = Object.keys(sessionStorage);
    
    // Synchroniser de localStorage vers sessionStorage (pour les nouvelles données)
    localStorageKeys.forEach(key => {
      // Ne synchroniser que les clés qui semblent être des données JSON (pas les marqueurs de sync)
      if (!key.startsWith('sync_') && !key.includes('_last_saved')) {
        const value = localStorage.getItem(key);
        if (value && !sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, value);
          console.log(`SyncStorageManager: Synchronisé localStorage → sessionStorage pour ${key}`);
        }
      }
    });
    
    // Synchroniser de sessionStorage vers localStorage (pour les modifications récentes)
    sessionStorageKeys.forEach(key => {
      // Ne synchroniser que les clés qui semblent être des données JSON (pas les marqueurs de sync)
      if (!key.startsWith('sync_') && !key.includes('_last_saved')) {
        const value = sessionStorage.getItem(key);
        const localValue = localStorage.getItem(key);
        
        // Si la valeur existe dans sessionStorage mais pas dans localStorage, ou si elle est différente
        if (value && (!localValue || localValue !== value)) {
          localStorage.setItem(key, value);
          console.log(`SyncStorageManager: Synchronisé sessionStorage → localStorage pour ${key}`);
        }
      }
    });
    
    console.log(`SyncStorageManager: Synchronisation des storages terminée`);
  } catch (error) {
    console.error(`SyncStorageManager: Erreur lors de la synchronisation des storages:`, error);
  }
};

// Initialiser le nettoyage et la synchronisation
export const initializeStorageManager = (): void => {
  // Nettoyer localStorage au démarrage
  cleanupLocalStorage();
  
  // Synchroniser localStorage et sessionStorage au démarrage
  syncStorages();
  
  // Écouter les événements de focus pour synchroniser à nouveau
  if (typeof window !== 'undefined') {
    window.addEventListener('focus', syncStorages);
    
    // Synchroniser avant de quitter la page
    window.addEventListener('beforeunload', syncStorages);
    
    console.log('SyncStorageManager: Écouteurs d\'événements configurés');
  }
};

// Appeler l'initialisation immédiatement
if (typeof window !== 'undefined') {
  initializeStorageManager();
}
