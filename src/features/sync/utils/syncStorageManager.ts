
/**
 * Gestionnaire de stockage local pour la synchronisation
 * Assure une segmentation stricte des données par utilisateur
 * en utilisant p71x6d_richard comme base pour tous les utilisateurs
 */

// Constantes pour la validation
const RESTRICTED_IDS = ['system', 'admin', 'root', 'p71x6d_system', 'p71x6d_system2', '[object Object]', 'null', 'undefined'];
const DEFAULT_USER_ID = 'p71x6d_richard'; 
const BASE_DB_USER = 'p71x6d_richard'; // Base de données fixe pour TOUTES les opérations

/**
 * Vérifie si un ID est valide
 */
const isValidUserId = (userId: string | null | undefined): boolean => {
  if (!userId || typeof userId !== 'string') return false;
  if (RESTRICTED_IDS.includes(userId)) return false;
  if (userId === 'null' || userId === 'undefined') return false;
  return true;
};

/**
 * Obtient le préfixe utilisateur pour l'isolation des données
 * Basé sur l'email ou l'identifiant original, mais n'affecte pas la base utilisée
 */
const getUserPrefix = (): string => {
  const userEmail = localStorage.getItem('userEmail');
  if (userEmail) {
    if (userEmail === 'antcirier@gmail.com') {
      return 'admin';
    }
    // Extraire un préfixe de l'email
    return userEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_').substring(0, 10);
  }
  
  // Utiliser le préfixe stocké ou en créer un nouveau
  return localStorage.getItem('userPrefix') || `u${Math.floor(Math.random() * 10000)}`;
};

/**
 * Génère une clé de stockage unique pour chaque utilisateur
 * Utilise TOUJOURS p71x6d_richard comme base pour la BD,
 * mais ajoute un préfixe pour l'isolation des données par utilisateur
 */
export const getStorageKey = (tableName: string): string => {
  // Récupérer le préfixe utilisateur pour l'isolation des données
  const userPrefix = getUserPrefix();
  
  // Construire la clé avec l'utilisateur de BDD fixe mais le préfixe utilisateur
  return `${tableName}_${BASE_DB_USER}_${userPrefix}`;
};

// Sauvegarde des données dans le localStorage
export const saveLocalData = <T>(tableName: string, data: T[]): void => {
  try {
    const storageKey = getStorageKey(tableName);
    
    console.log(`syncStorageManager: Sauvegarde des données pour ${tableName} avec clé ${storageKey}`);
    
    localStorage.setItem(storageKey, JSON.stringify(data));
    localStorage.setItem(`${storageKey}_last_modified`, Date.now().toString());
    console.log(`syncStorageManager: Données ${tableName} sauvegardées avec succès (${data.length} éléments)`);
  } catch (e) {
    console.error(`syncStorageManager: Erreur lors de la sauvegarde ${tableName}:`, e);
  }
};

// Charge des données depuis le localStorage
export const loadLocalData = <T>(tableName: string): T[] => {
  try {
    const storageKey = getStorageKey(tableName);
    
    console.log(`syncStorageManager: Chargement des données pour ${tableName} avec clé ${storageKey}`);
    
    const data = localStorage.getItem(storageKey);
    if (!data) {
      console.log(`syncStorageManager: Pas de données locales pour ${tableName} (clé: ${storageKey})`);
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
export const getLastModified = (tableName: string): Date | null => {
  try {
    const storageKey = getStorageKey(tableName);
    const lastModified = localStorage.getItem(`${storageKey}_last_modified`);
    return lastModified ? new Date(parseInt(lastModified, 10)) : null;
  } catch (e) {
    console.error(`syncStorageManager: Erreur récupération last_modified ${tableName}:`, e);
    return null;
  }
};

// Obtient la date de dernière synchronisation d'une table
export const getLastSynced = (tableName: string): Date | null => {
  try {
    const storageKey = getStorageKey(tableName);
    const lastSynced = localStorage.getItem(`${storageKey}_last_synced`);
    return lastSynced ? new Date(parseInt(lastSynced, 10)) : null;
  } catch (e) {
    console.error(`syncStorageManager: Erreur récupération last_synced ${tableName}:`, e);
    return null;
  }
};

// Met à jour la date de dernière synchronisation d'une table
export const updateLastSynced = (tableName: string): void => {
  try {
    const storageKey = getStorageKey(tableName);
    localStorage.setItem(`${storageKey}_last_synced`, Date.now().toString());
    console.log(`syncStorageManager: Last synced mis à jour pour ${tableName}`);
  } catch (e) {
    console.error(`syncStorageManager: Erreur mise à jour last_synced ${tableName}:`, e);
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
      const hasRestrictedId = RESTRICTED_IDS.some(id => key.includes(id) && id !== BASE_DB_USER);
      const hasInvalidFormat = key.includes('[object Object]') || key.includes('undefined') || key.includes('null');
      
      if (hasRestrictedId || hasInvalidFormat) {
        console.log(`SyncStorageManager: Suppression de l'entrée malformée: ${key}`);
        localStorage.removeItem(key);
        entriesRemoved++;
        i--; // Ajuster l'index car la longueur du localStorage a changé
      }
    }
    
    console.log(`SyncStorageManager: Nettoyage terminé - ${entriesRemoved} entrées supprimées`);
  } catch (e) {
    console.error("SyncStorageManager: Erreur lors du nettoyage du localStorage:", e);
  }
};

// Initialiser un préfixe utilisateur s'il n'existe pas déjà
if (!localStorage.getItem('userPrefix')) {
  const randomPrefix = `u${Math.floor(Math.random() * 10000)}`;
  localStorage.setItem('userPrefix', randomPrefix);
  console.log(`syncStorageManager: Initialisation du préfixe utilisateur: ${randomPrefix}`);
}

// S'assurer que l'userId est toujours p71x6d_richard
if (localStorage.getItem('userId') !== BASE_DB_USER) {
  localStorage.setItem('userId', BASE_DB_USER);
  localStorage.setItem('user_id', BASE_DB_USER);
  console.log(`syncStorageManager: Correction de l'ID utilisateur à ${BASE_DB_USER}`);
}

// Initialisation: Nettoyer le localStorage au démarrage de l'application
cleanupStorage();
