import { Membre } from '@/types/membres';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { useToast } from '@/hooks/use-toast';
import { SyncService, getCurrentUserId } from '../core/syncService';

// Instance du service de synchronisation pour les membres
const membresSync = new SyncService('membres', 'MembresController.php');

/**
 * Charge les membres depuis le localStorage ou retourne une liste par défaut
 */
export const loadMembresFromStorage = (currentUser: string): Membre[] => {
  const defaultMembres: Membre[] = [
    {
      id: '1',
      nom: 'Dupont',
      prenom: 'Jean',
      fonction: 'Directeur',
      initiales: 'JD',
      date_creation: new Date(),
      mot_de_passe: 'password123' // Note: Dans une vraie application, ne jamais stocker les mots de passe en clair
    },
    {
      id: '2',
      nom: 'Martin',
      prenom: 'Sophie',
      fonction: 'Chef de projet',
      initiales: 'SM',
      date_creation: new Date(),
      mot_de_passe: 'password123'
    }
  ];

  // Charger les membres avec le service de synchronisation
  const membres = membresSync.loadFromStorage<Membre>(currentUser, defaultMembres);
  
  // S'assurer que les dates sont des objets Date
  return membres.map(membre => ({
    ...membre,
    date_creation: membre.date_creation ? new Date(membre.date_creation) : new Date()
  }));
};

/**
 * Sauvegarde les membres dans le localStorage et les synchronise avec le serveur
 */
export const saveMembresInStorage = (membres: Membre[], currentUser: string): void => {
  membresSync.saveToStorage<Membre>(membres, currentUser);
};

/**
 * Synchronise les membres avec le serveur
 */
export const syncMembresWithServer = async (
  membres: Membre[],
  currentUser: string
): Promise<boolean> => {
  return membresSync.syncWithServer<Membre>(membres, currentUser);
};

/**
 * Retourne une liste de membres par défaut
 */
const getDefaultMembres = (): Membre[] => {
  return [
    {
      id: '1',
      nom: 'Dupont',
      prenom: 'Jean',
      fonction: 'Directeur',
      initiales: 'JD',
      date_creation: new Date(),
      mot_de_passe: 'password123' // Note: Dans une vraie application, ne jamais stocker les mots de passe en clair
    },
    {
      id: '2',
      nom: 'Martin',
      prenom: 'Sophie',
      fonction: 'Chef de projet',
      initiales: 'SM',
      date_creation: new Date(),
      mot_de_passe: 'password123'
    }
  ];
};
