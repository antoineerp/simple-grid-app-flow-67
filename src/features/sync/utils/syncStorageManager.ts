
/**
 * Gestionnaire de stockage local pour la synchronisation
 */

import { getCurrentUser } from '@/services/core/databaseConnectionService';

// Génère une clé de stockage unique pour une table et un utilisateur
export const getStorageKey = (tableName: string, userId?: string | null): string => {
  // Si userId est un objet, récupérer l'ID de l'utilisateur courant
  if (userId && typeof userId === 'object') {
    console.error(`syncStorageManager: userId est un objet et non une chaîne de caractères pour ${tableName}`);
    userId = getCurrentUser();
  }
  
  // Si userId est undefined/null, récupérer l'ID de l'utilisateur courant
  const userIdToUse = userId || getCurrentUser();
  
  // Vérifier que l'ID utilisateur est une chaîne de caractères valide
  if (typeof userIdToUse !== 'string' || userIdToUse === '[object Object]') {
    console.error(`syncStorageManager: ID utilisateur invalide pour ${tableName}: ${userIdToUse}`);
    return `${tableName}_${getCurrentUser()}`;
  }
  
  return `${tableName}_${userIdToUse}`;
};

// Sauvegarde des données dans le localStorage
export const saveLocalData = <T>(tableName: string, data: T[], userId?: string): void => {
  try {
    const storageKey = getStorageKey(tableName, userId);
    
    // Vérifier que la clé ne contient pas [object Object]
    if (storageKey.includes('[object Object]')) {
      console.error(`syncStorageManager: Clé de stockage invalide: ${storageKey}`);
      return;
    }
    
    localStorage.setItem(storageKey, JSON.stringify(data));
    localStorage.setItem(`${storageKey}_last_modified`, Date.now().toString());
    console.log(`syncStorageManager: Données ${tableName} sauvegardées avec succès (${data.length} éléments)`);
  } catch (e) {
    console.error(`syncStorageManager: Erreur lors de la sauvegarde ${tableName}:`, e);
  }
};

// Charge des données depuis le localStorage
export const loadLocalData = <T>(tableName: string, userId?: string): T[] => {
  try {
    const storageKey = getStorageKey(tableName, userId);
    
    // Vérifier que la clé ne contient pas [object Object]
    if (storageKey.includes('[object Object]')) {
      console.error(`syncStorageManager: Clé de chargement invalide: ${storageKey}`);
      return [];
    }
    
    const data = localStorage.getItem(storageKey);
    if (!data) {
      console.log(`syncStorageManager: Pas de données locales pour ${tableName}`);
      return [];
    }
    
    const parsedData = JSON.parse(data) as T[];
    console.log(`syncStorageManager: Données ${tableName} chargées avec succès (${parsedData.length} éléments)`);
    return parsedData;
  } catch (e) {
    console.error(`syncStorageManager: Erreur lors du chargement ${tableName}:`, e);
    return [];
  }
};

// Obtient la date de dernière modification d'une table
export const getLastModified = (tableName: string, userId?: string): Date | null => {
  try {
    const storageKey = getStorageKey(tableName, userId);
    const lastModified = localStorage.getItem(`${storageKey}_last_modified`);
    return lastModified ? new Date(parseInt(lastModified, 10)) : null;
  } catch (e) {
    console.error(`syncStorageManager: Erreur lors de la récupération de last_modified ${tableName}:`, e);
    return null;
  }
};

// Obtient la date de dernière synchronisation d'une table
export const getLastSynced = (tableName: string, userId?: string): Date | null => {
  try {
    const storageKey = getStorageKey(tableName, userId);
    const lastSynced = localStorage.getItem(`${storageKey}_last_synced`);
    return lastSynced ? new Date(parseInt(lastSynced, 10)) : null;
  } catch (e) {
    console.error(`syncStorageManager: Erreur lors de la récupération de last_synced ${tableName}:`, e);
    return null;
  }
};

// Met à jour la date de dernière synchronisation d'une table
export const updateLastSynced = (tableName: string, userId?: string): void => {
  try {
    const storageKey = getStorageKey(tableName, userId);
    localStorage.setItem(`${storageKey}_last_synced`, Date.now().toString());
  } catch (e) {
    console.error(`syncStorageManager: Erreur lors de la mise à jour de last_synced ${tableName}:`, e);
  }
};

// Nettoie le localStorage des entrées corrompues
export const cleanupStorage = (): void => {
  console.log("SyncStorageManager: Nettoyage de localStorage en cours");
  
  try {
    let entriesRemoved = 0;
    
    // Rechercher les clés contenant [object Object]
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('[object Object]')) {
        console.log(`SyncStorageManager: Suppression de l'entrée malformée dans localStorage: ${key}`);
        localStorage.removeItem(key);
        entriesRemoved++;
      }
    }
    
    console.log(`SyncStorageManager: Nettoyage de localStorage terminé - ${entriesRemoved} entrées supprimées`);
  } catch (e) {
    console.error("SyncStorageManager: Erreur lors du nettoyage du localStorage:", e);
  }
};

// Initialisation: Nettoyer le localStorage au démarrage de l'application
cleanupStorage();
