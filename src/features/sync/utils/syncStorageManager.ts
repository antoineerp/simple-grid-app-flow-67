/**
 * Gestionnaire de stockage local pour la synchronisation
 */

import { getCurrentUser } from '@/services/core/databaseConnectionService';

// Constantes pour la validation
const RESTRICTED_IDS = ['system', 'admin', 'root', 'p71x6d_system', 'p71x6d_system2', '[object Object]', 'null', 'undefined'];
const DEFAULT_USER_ID = 'p71x6d_richard';
const BASE_DB_USER = 'p71x6d_richard';

/**
 * Vérifie si un ID est valide
 */
const isValidUserId = (userId: string | null | undefined): boolean => {
  if (!userId || typeof userId !== 'string') return false;
  if (RESTRICTED_IDS.includes(userId)) return false;
  if (userId === 'null' || userId === 'undefined') return false;
  return true;
};

// Génère une clé de stockage unique pour une table et un utilisateur
export const getStorageKey = (tableName: string, userId?: string | null): string => {
  // Utiliser l'ID utilisateur fixe pour la base de données mais ajouter un préfixe utilisateur
  // pour la séparation des données entre utilisateurs
  const currentUserId = userId || getCurrentUser();
  
  // Préfixe pour garantir que la table appartient à l'utilisateur actuel
  const userPrefix = localStorage.getItem('userPrefix') || 'u1';
  
  // Construire la clé avec l'utilisateur de BDD fixe mais le préfixe utilisateur local
  console.log(`syncStorageManager: Génération de clé pour ${tableName} - Base: ${BASE_DB_USER}, Préfixe: ${userPrefix}`);
  return `${tableName}_${BASE_DB_USER}_${userPrefix}`;
};

// Sauvegarde des données dans le localStorage
export const saveLocalData = <T>(tableName: string, data: T[], userId?: string): void => {
  try {
    const storageKey = getStorageKey(tableName, userId);
    
    console.log(`syncStorageManager: Sauvegarde des données pour ${tableName} dans la base ${BASE_DB_USER}`);
    
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
    
    console.log(`syncStorageManager: Chargement des données pour ${tableName} depuis la base ${BASE_DB_USER}`);
    
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
    
    // Rechercher les clés contenant des identifiants problématiques
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      // Vérifier si la clé contient un identifiant système ou problématique
      const hasRestrictedId = RESTRICTED_IDS.some(id => key.includes(id));
      const hasInvalidFormat = key.includes('[object Object]') || key.includes('undefined') || key.includes('null');
      
      if (hasRestrictedId || hasInvalidFormat) {
        console.log(`SyncStorageManager: Suppression de l'entrée malformée dans localStorage: ${key}`);
        localStorage.removeItem(key);
        entriesRemoved++;
        i--; // Ajuster l'index car la longueur du localStorage a changé
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
  
  if (!isValidUserId(userId)) {
    console.warn(`SyncStorageManager: Tentative de nettoyage avec ID invalide: ${userId}, opération annulée`);
    return;
  }
  
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

// Initialiser un préfixe utilisateur s'il n'existe pas déjà
if (!localStorage.getItem('userPrefix')) {
  const randomPrefix = `u${Math.floor(Math.random() * 10000)}`;
  localStorage.setItem('userPrefix', randomPrefix);
  console.log(`syncStorageManager: Initialisation du préfixe utilisateur: ${randomPrefix}`);
}

// Initialisation: Nettoyer le localStorage au démarrage de l'application
cleanupStorage();
