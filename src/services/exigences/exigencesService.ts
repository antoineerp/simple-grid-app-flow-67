
import { Exigence } from '@/types/exigences';
import { SyncService, getCurrentUserId } from '../core/syncService';

// Instance du service de synchronisation pour les exigences
const exigencesSync = new SyncService('exigences', 'ExigencesController.php');

/**
 * Charge les exigences depuis le localStorage ou retourne une liste par défaut
 */
export const loadExigencesFromStorage = (currentUser: string): Exigence[] => {
  const defaultExigences: Exigence[] = [
    { 
      id: '1', 
      nom: 'Levée du courrier', 
      responsabilites: { r: [], a: [], c: [], i: [] },
      exclusion: false,
      atteinte: null,
      date_creation: new Date(),
      date_modification: new Date()
    },
    { 
      id: '2', 
      nom: 'Ouverture du courrier', 
      responsabilites: { r: [], a: [], c: [], i: [] },
      exclusion: false,
      atteinte: null,
      date_creation: new Date(),
      date_modification: new Date()
    },
  ];

  // Charger les exigences avec le service de synchronisation
  const exigences = exigencesSync.loadFromStorage<Exigence>(currentUser, defaultExigences);
  
  // S'assurer que les dates sont des objets Date
  return exigences.map(exigence => ({
    ...exigence,
    date_creation: exigence.date_creation ? new Date(exigence.date_creation) : new Date(),
    date_modification: exigence.date_modification ? new Date(exigence.date_modification) : new Date()
  }));
};

/**
 * Sauvegarde les exigences dans le localStorage et les synchronise avec le serveur
 */
export const saveExigencesToStorage = (exigences: Exigence[], currentUser: string): void => {
  exigencesSync.saveToStorage<Exigence>(exigences, currentUser);
};

/**
 * Synchronise les exigences avec le serveur
 */
export const syncExigencesWithServer = async (
  exigences: Exigence[],
  currentUser: string
): Promise<boolean> => {
  return exigencesSync.syncWithServer<Exigence>(exigences, currentUser);
};

/**
 * Calcule les statistiques des exigences
 */
export const calculateExigenceStats = (exigences: Exigence[]) => {
  const exclusionCount = exigences.filter(e => e.exclusion).length;
  const nonExcludedExigences = exigences.filter(e => !e.exclusion);
  
  return {
    exclusion: exclusionCount,
    nonConforme: nonExcludedExigences.filter(e => e.atteinte === 'NC').length,
    partiellementConforme: nonExcludedExigences.filter(e => e.atteinte === 'PC').length,
    conforme: nonExcludedExigences.filter(e => e.atteinte === 'C').length,
    total: nonExcludedExigences.length
  };
};
