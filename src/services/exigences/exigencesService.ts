
import { Exigence } from '@/types/exigences';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { SyncService } from '../core/syncService';

// Instance du service de synchronisation pour les exigences
const exigencesSync = new SyncService('exigences', 'ExigencesController.php');

/**
 * Charge les exigences depuis le localStorage ou retourne une liste par défaut
 */
export const loadExigencesFromStorage = (currentUser: string): Exigence[] => {
  const defaultExigences: Exigence[] = [
    {
      id: '1',
      numero: 'E.1.1',
      niveau: 'Indicateur',
      intitule: 'Le prestataire diffuse une information accessible au public...',
      chapitre: 'Information et orientation des publics',
      description: 'Lorem ipsum dolor sit amet',
      criteres: ['Locaux accessibles', 'Site web adapté'],
      preuves: ['Document 1', 'Document 2'],
      status: 'À faire',
      date_creation: new Date(),
      date_modification: new Date()
    },
    {
      id: '2',
      numero: 'E.1.2',
      niveau: 'Critère',
      intitule: 'Le prestataire met en œuvre des prestations d'information...',
      chapitre: 'Information et orientation des publics',
      description: 'Lorem ipsum dolor sit amet',
      criteres: ['Information claire', 'Délais respectés'],
      preuves: ['Document 3', 'Document 4'],
      status: 'En cours',
      date_creation: new Date(),
      date_modification: new Date()
    }
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
export const saveExigencesInStorage = (exigences: Exigence[], currentUser: string): void => {
  console.log(`Sauvegarde de ${exigences.length} exigences pour l'utilisateur ${currentUser}`);
  exigencesSync.saveToStorage<Exigence>(exigences, currentUser);
};

/**
 * Synchronise les exigences avec le serveur
 */
export const syncExigencesWithServer = async (
  exigences: Exigence[],
  currentUser: string
): Promise<boolean> => {
  console.log(`Synchronisation de ${exigences.length} exigences pour l'utilisateur ${currentUser}`);
  return exigencesSync.syncWithServer<Exigence>(exigences, currentUser);
};
