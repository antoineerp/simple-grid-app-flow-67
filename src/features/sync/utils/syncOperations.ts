
// syncOperations.ts - Fonctions utilitaires pour la synchronisation

import { getDbUser } from "@/services/core/databaseConnectionManager";
import { v4 as uuidv4 } from 'uuid';

// Constante pour la base de données fixe
const FIXED_DB_USER = 'p71x6d_richard';
// Durée maximale d'une synchronisation avant qu'elle ne soit considérée comme bloquée (5 minutes)
const SYNC_TIMEOUT_MS = 5 * 60 * 1000;

// Types de base pour la synchronisation
export interface SyncableItem {
  id: string;
  [key: string]: any;
}

/**
 * Génère une clé de stockage unique pour une table spécifique
 * Cette fonction assure que chaque utilisateur a ses propres données dans le stockage local,
 * tout en utilisant la même base de données p71x6d_richard
 */
export const generateStorageKey = (tableName: string): string => {
  // Récupérer le préfixe utilisateur pour la séparation des données
  const userPrefix = localStorage.getItem('userPrefix') || 'default';
  
  // Utiliser p71x6d_richard comme identifiant de base, mais séparer par préfixe d'utilisateur
  return `${tableName}_${FIXED_DB_USER}_${userPrefix}`;
};

/**
 * Sauvegarde des données dans le stockage local
 */
export const saveToStorage = <T extends SyncableItem>(tableName: string, items: T[]): void => {
  try {
    const storageKey = generateStorageKey(tableName);
    localStorage.setItem(storageKey, JSON.stringify(items));
    localStorage.setItem(`${storageKey}_lastUpdated`, Date.now().toString());
    console.log(`syncOperations: Données sauvegardées pour ${tableName} (${items.length} éléments)`);
  } catch (error) {
    console.error(`syncOperations: Erreur lors de la sauvegarde pour ${tableName}:`, error);
  }
};

/**
 * Charge des données depuis le stockage local
 */
export const loadFromStorage = <T extends SyncableItem>(tableName: string): T[] => {
  try {
    const storageKey = generateStorageKey(tableName);
    const data = localStorage.getItem(storageKey);
    
    if (!data) {
      return [];
    }
    
    return JSON.parse(data) as T[];
  } catch (error) {
    console.error(`syncOperations: Erreur lors du chargement pour ${tableName}:`, error);
    return [];
  }
};

/**
 * Obtient la date de dernière mise à jour
 */
export const getLastUpdateTime = (tableName: string): Date | null => {
  try {
    const storageKey = generateStorageKey(tableName);
    const timestamp = localStorage.getItem(`${storageKey}_lastUpdated`);
    
    if (!timestamp) {
      return null;
    }
    
    return new Date(parseInt(timestamp, 10));
  } catch (error) {
    console.error(`syncOperations: Erreur lors de la récupération de la date de mise à jour pour ${tableName}:`, error);
    return null;
  }
};

/**
 * Obtient la date de dernière synchronisation
 */
export const getLastSyncTime = (tableName: string): Date | null => {
  try {
    const storageKey = generateStorageKey(tableName);
    const timestamp = localStorage.getItem(`${storageKey}_lastSynced`);
    
    if (!timestamp) {
      return null;
    }
    
    return new Date(parseInt(timestamp, 10));
  } catch (error) {
    console.error(`syncOperations: Erreur lors de la récupération de la date de synchronisation pour ${tableName}:`, error);
    return null;
  }
};

/**
 * Met à jour la date de dernière synchronisation
 */
export const updateLastSyncTime = (tableName: string): void => {
  try {
    const storageKey = generateStorageKey(tableName);
    localStorage.setItem(`${storageKey}_lastSynced`, Date.now().toString());
  } catch (error) {
    console.error(`syncOperations: Erreur lors de la mise à jour de la date de synchronisation pour ${tableName}:`, error);
  }
};

/**
 * Crée un nouvel élément avec un ID unique
 * Correction de l'erreur TS2352: Ajout d'une conversion de type appropriée
 */
export const createItemWithId = <T extends SyncableItem>(tableName: string, data: Partial<T>): T => {
  const id = data.id || uuidv4();
  
  // Utilisation d'une conversion explicite vers unknown puis vers T pour satisfaire TypeScript
  const newItem = {
    id,
    date_creation: new Date(),
    date_modification: new Date(),
    ...data
  } as unknown as T;
  
  return newItem;
};

/**
 * Fusionne les données locales et serveur (stratégie configurable)
 */
export const mergeData = <T extends SyncableItem>(
  localData: T[],
  serverData: T[],
  strategy: 'server-wins' | 'local-wins' | 'newest-wins' = 'server-wins'
): T[] => {
  if (!localData.length) return serverData;
  if (!serverData.length) return localData;
  
  // Créer une map pour un accès plus rapide
  const localMap = new Map(localData.map(item => [item.id, item]));
  const serverMap = new Map(serverData.map(item => [item.id, item]));
  const result: T[] = [];
  
  // Traiter tous les éléments du serveur
  serverMap.forEach((serverItem, id) => {
    const localItem = localMap.get(id);
    
    // Si l'élément n'existe pas localement ou si la stratégie est server-wins
    if (!localItem || strategy === 'server-wins') {
      result.push(serverItem);
    }
    // Si la stratégie est local-wins
    else if (strategy === 'local-wins') {
      result.push(localItem);
    }
    // Si la stratégie est newest-wins
    else if (strategy === 'newest-wins') {
      const serverDate = new Date(serverItem.date_modification || serverItem.date_creation || 0);
      const localDate = new Date(localItem.date_modification || localItem.date_creation || 0);
      
      if (serverDate > localDate) {
        result.push(serverItem);
      } else {
        result.push(localItem);
      }
    }
    
    // Supprimer de la map locale pour tracking
    localMap.delete(id);
  });
  
  // Ajouter les éléments qui n'existent que localement
  localMap.forEach((localItem) => {
    result.push(localItem);
  });
  
  return result;
};

/**
 * Vérifie si une synchronisation est en cours pour une table spécifique
 * Amélioré avec détection des synchronisations bloquées
 */
export const isSynchronizing = (tableName: string): boolean => {
  try {
    const storageKey = generateStorageKey(tableName);
    const isSyncingFlag = localStorage.getItem(`${storageKey}_syncing`);
    
    // Si le flag n'est pas défini, pas de synchronisation en cours
    if (isSyncingFlag !== 'true') {
      return false;
    }
    
    // Vérifier si la synchronisation est potentiellement bloquée
    const syncStartTime = localStorage.getItem(`${storageKey}_syncing_started_at`);
    if (syncStartTime) {
      const elapsed = Date.now() - parseInt(syncStartTime, 10);
      
      // Si la synchronisation dure depuis trop longtemps, on considère qu'elle est bloquée
      if (elapsed > SYNC_TIMEOUT_MS) {
        console.warn(`syncOperations: Synchronisation pour ${tableName} bloquée depuis ${Math.round(elapsed/1000/60)} minutes, réinitialisation des flags`);
        
        // Réinitialiser les flags
        localStorage.removeItem(`${storageKey}_syncing`);
        localStorage.removeItem(`${storageKey}_syncing_started_at`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error(`syncOperations: Erreur lors de la vérification de l'état de synchronisation pour ${tableName}:`, error);
    return false;
  }
};

/**
 * Exécute une opération de synchronisation
 * Amélioré avec timestamp de début de synchronisation
 */
export const executeSyncOperation = async <T>(
  tableName: string, 
  data: T[], 
  syncFn: (table: string, tableData: T[], operationId: string) => Promise<boolean>,
  userId: string,
  trigger: "auto" | "manual" | "initial" = "manual"
): Promise<{ success: boolean; message: string }> => {
  try {
    const storageKey = generateStorageKey(tableName);
    
    // Vérifier si une synchronisation est déjà en cours
    if (isSynchronizing(tableName)) {
      return { 
        success: false, 
        message: `Une synchronisation est déjà en cours pour ${tableName}` 
      };
    }
    
    const operationId = uuidv4();
    
    // Marquer la synchronisation comme en cours avec timestamp
    localStorage.setItem(`${storageKey}_syncing`, 'true');
    localStorage.setItem(`${storageKey}_syncing_started_at`, Date.now().toString());
    
    console.log(`syncOperations: Début de synchronisation pour ${tableName} (${trigger}), opération ${operationId}`);
    
    // Exécuter la fonction de synchronisation
    const success = await syncFn(tableName, data, operationId);
    
    // Mettre à jour l'état de la synchronisation
    if (success) {
      localStorage.setItem(`${storageKey}_lastSynced`, Date.now().toString());
      return { success: true, message: "Synchronisation réussie" };
    } else {
      return { success: false, message: "Échec de la synchronisation" };
    }
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Erreur inconnue" 
    };
  } finally {
    // Nettoyer les flags de synchronisation, quelle que soit l'issue
    const storageKey = generateStorageKey(tableName);
    localStorage.removeItem(`${storageKey}_syncing`);
    localStorage.removeItem(`${storageKey}_syncing_started_at`);
    console.log(`syncOperations: Fin de synchronisation pour ${tableName}`);
  }
};

/**
 * Vérifie et nettoie les synchronisations potentiellement bloquées dans le localStorage
 */
export const cleanupStaleSyncs = (): void => {
  try {
    // Parcourir toutes les entrées du localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      // Chercher les flags de synchronisation
      if (key.endsWith('_syncing')) {
        const baseName = key.replace('_syncing', '');
        const startTimeKey = `${baseName}_syncing_started_at`;
        const startTime = localStorage.getItem(startTimeKey);
        
        if (startTime) {
          const elapsed = Date.now() - parseInt(startTime, 10);
          
          // Si la synchronisation est bloquée depuis trop longtemps
          if (elapsed > SYNC_TIMEOUT_MS) {
            console.warn(`syncOperations: Nettoyage d'une synchronisation bloquée pour ${baseName} depuis ${Math.round(elapsed/1000/60)} minutes`);
            localStorage.removeItem(key);
            localStorage.removeItem(startTimeKey);
          }
        } else {
          // Si on trouve un flag _syncing sans timestamp associé, on le supprime aussi
          console.warn(`syncOperations: Nettoyage d'un flag de synchronisation orphelin pour ${baseName}`);
          localStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.error(`syncOperations: Erreur lors du nettoyage des synchronisations bloquées:`, error);
  }
};

// Exécuter un nettoyage au chargement du module
cleanupStaleSyncs();
