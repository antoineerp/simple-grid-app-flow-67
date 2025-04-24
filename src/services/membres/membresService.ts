
import { Membre } from '@/types/membres';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { useToast } from '@/hooks/use-toast';
import { SyncService, getCurrentUserId } from '../core/syncService';

// Instance du service de synchronisation pour les membres
const membresSync = new SyncService('membres', 'MembresController.php');

/**
 * Charge les membres depuis le serveur puis le localStorage en fallback
 */
export const loadMembresFromStorage = async (currentUser: string): Promise<Membre[]> => {
  console.log(`Chargement des membres pour l'utilisateur: ${currentUser}`);
  
  try {
    // Essayer d'abord de charger depuis le serveur
    const serverMembres = await membresSync.loadFromServer<Membre>(currentUser);
    
    if (serverMembres && Array.isArray(serverMembres) && serverMembres.length > 0) {
      console.log(`${serverMembres.length} membres chargés depuis le serveur`);
      
      // Formater les dates
      const formattedMembres = serverMembres.map(membre => ({
        ...membre,
        date_creation: membre.date_creation ? new Date(membre.date_creation) : new Date()
      }));
      
      // Mettre à jour le localStorage avec les données du serveur
      localStorage.setItem(`membres_${currentUser}`, JSON.stringify(formattedMembres));
      
      return formattedMembres;
    }
  } catch (error) {
    console.error("Erreur lors du chargement des membres depuis le serveur:", error);
  }
  
  // Si le chargement depuis le serveur a échoué, essayer le localStorage
  const defaultMembres: Membre[] = [
    {
      id: '1',
      nom: 'Dupont',
      prenom: 'Jean',
      fonction: 'Directeur',
      initiales: 'JD',
      date_creation: new Date(),
      mot_de_passe: 'password123'
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

  // Charger les membres localement
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
  console.log(`Sauvegarde de ${membres.length} membres pour l'utilisateur: ${currentUser}`);
  
  // Sauvegarde dans localStorage et tente de synchroniser avec le serveur
  membresSync.saveToStorage<Membre>(membres, currentUser);
  
  // Force une synchronisation immédiate avec le serveur
  syncMembresWithServer(membres, currentUser)
    .then(success => {
      console.log(`Synchronisation des membres: ${success ? 'réussie' : 'échouée'}`);
    })
    .catch(error => {
      console.error("Erreur lors de la synchronisation des membres:", error);
    });
};

/**
 * Synchronise les membres avec le serveur
 */
export const syncMembresWithServer = async (
  membres: Membre[],
  currentUser: string
): Promise<boolean> => {
  console.log(`Tentative de synchronisation de ${membres.length} membres avec le serveur pour ${currentUser}`);
  try {
    const result = await membresSync.syncWithServer<Membre>(membres, currentUser);
    console.log(`Résultat de la synchronisation: ${result ? 'succès' : 'échec'}`);
    return result;
  } catch (error) {
    console.error("Erreur lors de la synchronisation des membres avec le serveur:", error);
    return false;
  }
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
      mot_de_passe: 'password123'
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
