
import { Membre } from '@/types/membres';
import { createLocalTableForUser } from './membreLocalSync';

/**
 * Loads membres from localStorage for a specific user
 */
export const loadMembresFromStorage = (currentUser: string): Membre[] => {
  const storedMembres = localStorage.getItem(`membres_${currentUser}`);
  
  if (storedMembres) {
    return JSON.parse(storedMembres);
  } else {
    const defaultMembres = localStorage.getItem('membres_template') || localStorage.getItem('membres');
    
    if (defaultMembres) {
      // Créer une nouvelle table locale pour l'utilisateur
      createLocalTableForUser(currentUser);
      return JSON.parse(defaultMembres);
    }
    
    // Données par défaut
    const defaultData = [
      { 
        id: '1', 
        nom: 'Dupont',
        prenom: 'Jean',
        fonction: 'Directeur',
        initiales: 'JD',
        date_creation: new Date(),
        mot_de_passe: '' 
      },
      { 
        id: '2', 
        nom: 'Martin',
        prenom: 'Sophie',
        fonction: 'Qualité',
        initiales: 'SM',
        date_creation: new Date(),
        mot_de_passe: ''
      },
    ];
    
    // Créer la table et retourner les données par défaut
    localStorage.setItem(`membres_${currentUser}`, JSON.stringify(defaultData));
    return defaultData;
  }
};

/**
 * Saves membres to localStorage for a specific user
 */
export const saveMembrestoStorage = (membres: Membre[], currentUser: string): void => {
  localStorage.setItem(`membres_${currentUser}`, JSON.stringify(membres));
  
  // Si user est admin, aussi sauvegarder comme template
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'admin' || userRole === 'administrateur') {
    localStorage.setItem('membres_template', JSON.stringify(membres));
  }
  
  // Notifier sur la mise à jour des membres
  window.dispatchEvent(new Event('membresUpdate'));
};
