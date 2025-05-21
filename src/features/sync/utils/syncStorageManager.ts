
/**
 * Gestionnaire de stockage local pour la synchronisation
 */

import { getCurrentUser } from '@/services/core/databaseConnectionService';

// Génère une clé de stockage unique pour une table et un utilisateur
export const getStorageKey = (tableName: string, userId?: string | null): string => {
  // Si aucun ID n'est fourni, utiliser l'ID de l'utilisateur connecté
  const currentUserId = userId || getCurrentUser();
  
  // Vérifier que l'ID utilisateur est valide
  if (!currentUserId || typeof currentUserId !== 'string') {
    console.error(`syncStorageManager: ID utilisateur invalide pour ${tableName}`, currentUserId);
    return `${tableName}_error`;
  }
  
  // S'assurer que l'ID n'est pas 'p71x6d_system2' par erreur
  if (currentUserId === 'p71x6d_system2' && process.env.NODE_ENV === 'production') {
    console.warn(`syncStorageManager: Utilisateur système détecté pour ${tableName}, vérification nécessaire`);
  }
  
  // Remplacer les caractères problématiques dans l'identifiant utilisateur
  const safeUserId = currentUserId.replace(/[^a-zA-Z0-9_]/g, '_');
  
  return `${tableName}_${safeUserId}`;
};

// Sauvegarde des données dans le localStorage
export const saveLocalData = <T>(tableName: string, data: T[], userId?: string): void => {
  try {
    const storageKey = getStorageKey(tableName, userId);
    console.log(`syncStorageManager: Sauvegarde des données pour ${tableName} avec utilisateur ${userId || getCurrentUser()}`);
    
    localStorage.setItem(storageKey, JSON.stringify(data));
    localStorage.setItem(`${storageKey}_last_modified`, Date.now().toString());
    console.log(`syncStorageManager: Données ${tableName} sauvegardées avec succès (${data.length} éléments) avec clé ${storageKey}`);
  } catch (e) {
    console.error(`syncStorageManager: Erreur lors de la sauvegarde ${tableName}:`, e);
  }
};

// Charge des données depuis le localStorage
export const loadLocalData = <T>(tableName: string, userId?: string): T[] => {
  try {
    const storageKey = getStorageKey(tableName, userId);
    console.log(`syncStorageManager: Chargement des données pour ${tableName} avec utilisateur ${userId || getCurrentUser()}`);
    
    const data = localStorage.getItem(storageKey);
    if (!data) {
      console.log(`syncStorageManager: Pas de données locales pour ${tableName} (clé: ${storageKey})`);
      return [];
    }
    
    const parsedData = JSON.parse(data) as T[];
    console.log(`syncStorageManager: Données ${tableName} chargées avec succès (${parsedData.length} éléments) depuis clé ${storageKey}`);
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
    console.log(`syncStorageManager: Last synced mis à jour pour ${tableName} (utilisateur: ${userId || getCurrentUser()})`);
  } catch (e) {
    console.error(`syncStorageManager: Erreur lors de la mise à jour de last_synced ${tableName}:`, e);
  }
};

// Nettoie le localStorage des entrées corrompues
export const cleanupStorage = (): void => {
  console.log("SyncStorageManager: Nettoyage de localStorage en cours");
  
  try {
    let entriesRemoved = 0;
    
    // Rechercher les clés contenant [object Object] ou autres problèmes
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('[object Object]') || 
        key.includes('undefined') ||
        key.includes('null') ||
        key.includes('p71x6d_system2')  // Ajouter la détection de cet ID problématique
      )) {
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

// Nettoyer les données d'un utilisateur spécifique
export const cleanupUserData = (userId: string): void => {
  console.log(`SyncStorageManager: Nettoyage des données pour l'utilisateur ${userId}`);
  
  try {
    let entriesRemoved = 0;
    
    // Parcourir toutes les clés et supprimer celles qui contiennent l'ID utilisateur
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(userId)) {
        console.log(`SyncStorageManager: Suppression de la clé ${key}`);
        localStorage.removeItem(key);
        entriesRemoved++;
        i--; // Ajuster l'index car la longueur du localStorage a changé
      }
    }
    
    console.log(`SyncStorageManager: Nettoyage terminé - ${entriesRemoved} entrées supprimées pour l'utilisateur ${userId}`);
  } catch (e) {
    console.error(`SyncStorageManager: Erreur lors du nettoyage des données utilisateur:`, e);
  }
};

// Initialisation: Nettoyer le localStorage au démarrage de l'application
cleanupStorage();
