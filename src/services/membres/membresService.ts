
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
    // Créer une nouvelle table locale pour l'utilisateur
    createLocalTableForUser(currentUser);
    
    // Récupérer les données maintenant créées
    const newData = localStorage.getItem(`membres_${currentUser}`);
    return newData ? JSON.parse(newData) : [];
  }
};

/**
 * Saves membres to localStorage for a specific user
 */
export const saveMembrestoStorage = (membres: Membre[], currentUser: string): void => {
  localStorage.setItem(`membres_${currentUser}`, JSON.stringify(membres));
  
  // Si user est admin ou gestionnaire, aussi sauvegarder comme template
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'admin' || userRole === 'administrateur' || userRole === 'gestionnaire') {
    localStorage.setItem('membres_template', JSON.stringify(membres));
  }
  
  // Stocker le rôle de l'utilisateur pour référence future
  localStorage.setItem(`role_${currentUser}`, userRole || 'utilisateur');
  
  // Notifier sur la mise à jour des membres
  window.dispatchEvent(new Event('membresUpdate'));
};
