
import { Membre } from '@/types/membres';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { useToast } from '@/hooks/use-toast';

const API_URL = getApiUrl();

/**
 * Charge les membres depuis le localStorage ou retourne une liste par défaut
 */
export const loadMembresFromStorage = (currentUser: string): Membre[] => {
  console.log(`Chargement des membres pour l'utilisateur: ${currentUser}`);
  const storageKey = `membres_${currentUser}`;
  const storedMembres = localStorage.getItem(storageKey);
  
  if (storedMembres) {
    console.log(`Membres trouvés pour ${currentUser}`);
    try {
      const membres = JSON.parse(storedMembres);
      return membres.map((membre: any) => ({
        ...membre,
        date_creation: membre.date_creation ? new Date(membre.date_creation) : new Date()
      }));
    } catch (error) {
      console.error("Erreur lors du parsing des membres:", error);
      return getDefaultMembres();
    }
  } else {
    console.log(`Aucun membre existant pour ${currentUser}, chargement du template`);
    const defaultMembres = localStorage.getItem('membres_template') || localStorage.getItem('membres');
    
    if (defaultMembres) {
      console.log('Utilisation du template de membres');
      try {
        const membres = JSON.parse(defaultMembres);
        return membres.map((membre: any) => ({
          ...membre,
          date_creation: membre.date_creation ? new Date(membre.date_creation) : new Date()
        }));
      } catch (error) {
        console.error("Erreur lors du parsing du template de membres:", error);
        return getDefaultMembres();
      }
    }
    
    console.log('Création de membres par défaut');
    return getDefaultMembres();
  }
};

/**
 * Sauvegarde les membres dans le localStorage et tente de les synchroniser avec le serveur
 */
export const saveMembresInStorage = (membres: Membre[], currentUser: string): void => {
  console.log(`Sauvegarde des membres pour l'utilisateur: ${currentUser}`);
  const storageKey = `membres_${currentUser}`;
  localStorage.setItem(storageKey, JSON.stringify(membres));
  
  // Pour les admins et gestionnaires, sauvegarder aussi comme template
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'admin' || userRole === 'administrateur' || userRole === 'gestionnaire') {
    console.log('Sauvegarde du template de membres');
    localStorage.setItem('membres_template', JSON.stringify(membres));
  }
  
  // Essayer de synchroniser avec le serveur
  syncMembresWithServer(membres, currentUser)
    .then(success => {
      if (success) {
        console.log("Membres synchronisés avec le serveur avec succès");
      } else {
        console.warn("Échec de la synchronisation des membres avec le serveur");
      }
    })
    .catch(error => {
      console.error("Erreur lors de la synchronisation des membres:", error);
    });
  
  // Déclencher un événement pour notifier les autres composants
  window.dispatchEvent(new Event('membresUpdate'));
};

/**
 * Synchronise les membres avec le serveur
 */
export const syncMembresWithServer = async (
  membres: Membre[],
  currentUser: string
): Promise<boolean> => {
  try {
    console.log("Tentative de synchronisation des membres avec le serveur");
    
    // Pour l'instant, simulation de requête serveur
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // TODO: Implémenter l'appel API réel
    // const response = await fetch(`${API_URL}/controllers/MembresController.php`, {
    //   method: 'POST',
    //   headers: {
    //     ...getAuthHeaders(),
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ 
    //     user_id: currentUser,
    //     membres 
    //   })
    // });
    
    // if (!response.ok) {
    //   throw new Error(`Erreur HTTP: ${response.status}`);
    // }
    
    return true;
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
