
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

// Save data to local storage
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
      localStorage.setItem(storageKey, jsonData);
      console.log(`SyncStorageManager: ${data.length} éléments sauvegardés localement pour ${tableName}`);
    } catch (jsonError) {
      console.error(`SyncStorageManager: Erreur de conversion JSON pour ${tableName}:`, jsonError);
    }
  } catch (error) {
    console.error(`SyncStorageManager: Erreur lors de la sauvegarde des données pour ${tableName}:`, error);
  }
};

// Load data from local storage
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
    
    const localData = localStorage.getItem(storageKey);
    
    if (localData) {
      try {
        const parsedData = JSON.parse(localData);
        if (Array.isArray(parsedData)) {
          return parsedData;
        } else {
          console.warn(`SyncStorageManager: Les données pour ${tableName} ne sont pas un tableau`);
          return [];
        }
      } catch (parseError) {
        console.error(`SyncStorageManager: Erreur lors de l'analyse JSON pour ${tableName}:`, parseError);
        // Supprimer les données corrompues
        localStorage.removeItem(storageKey);
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
    
    localStorage.setItem(`pending_sync_${tableName}`, Date.now().toString());
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
  return localStorage.getItem(`pending_sync_${tableName}`) !== null;
};

// Nettoyage des entrées malformées dans le localStorage
export const cleanupMalformedData = (): void => {
  try {
    console.log("SyncStorageManager: Nettoyage des données malformées dans localStorage");
    
    // Rechercher les entrées qui pourraient être malformées
    const keys = Object.keys(localStorage);
    let cleanedCount = 0;
    
    for (const key of keys) {
      // Vérifier si la clé contient [object Object]
      if (key.includes('[object Object]')) {
        console.log(`Suppression de l'entrée malformée dans localStorage: ${key}`);
        localStorage.removeItem(key);
        cleanedCount++;
        continue;
      }
      
      // Vérifier si les données JSON sont valides
      try {
        const data = localStorage.getItem(key);
        if (data && (data.startsWith('{') || data.startsWith('['))) {
          JSON.parse(data);
        }
      } catch (e) {
        console.log(`Suppression de l'entrée avec JSON invalide dans localStorage: ${key}`);
        localStorage.removeItem(key);
        cleanedCount++;
      }
    }
    
    console.log(`SyncStorageManager: ${cleanedCount} entrées malformées nettoyées`);
  } catch (error) {
    console.error("SyncStorageManager: Erreur lors du nettoyage des données malformées:", error);
  }
};

// Exécuter le nettoyage au chargement
cleanupMalformedData();
