
/**
 * Opérations de synchronisation - COMPLÈTEMENT DÉSACTIVÉES
 * Ce fichier ne fait plus rien mais est maintenu pour compatibilité
 * avec les imports existants dans l'application.
 */

// Import des dépendances nécessaires uniquement pour la compatibilité de type
import { acquireLock, releaseLock } from "./syncLockManager";
import { syncMonitor } from "./syncMonitor";

// Fonction de synchronisation désactivée
export const synchronizeData = async (
  tableName: string, 
  userId: string
): Promise<boolean> => {
  console.log("Fonction de synchronisation complètement désactivée");
  return true; // Simuler un succès
};

// Fonction de chargement désactivée
export const loadSyncedData = async (
  tableName: string, 
  userId: string
): Promise<any[]> => {
  console.log("Fonction de chargement de données complètement désactivée");
  return []; // Retourner un tableau vide
};

// Désactiver toutes les autres fonctions de synchronisation
export const isCurrentlySyncing = (tableName: string): boolean => {
  return false;
};

export const markSyncComplete = (tableName: string): void => {
  // Ne fait rien
};

export const markSyncStarted = (tableName: string): void => {
  // Ne fait rien
};

export const markSyncFailed = (tableName: string, error: string): void => {
  // Ne fait rien
};

export const getLastSyncTime = (tableName: string): Date | null => {
  return new Date(); // Retourner la date actuelle comme simulation
};

export const hasPendingSync = (tableName: string): boolean => {
  return false;
};

export const getSyncStatus = (tableName: string) => {
  return {
    isSyncing: false,
    lastSynced: new Date(),
    error: null,
    pendingSync: false
  };
};

export const checkSyncPermission = async (
  userId: string,
  operation: string
): Promise<boolean> => {
  return true; // Toujours autoriser
};

export const executeSyncOperation = async (
  tableName: string,
  userId: string
): Promise<boolean> => {
  return true; // Simuler un succès
};

export const processQueuedSyncOperations = async (): Promise<boolean> => {
  return true; // Simuler un succès
};
