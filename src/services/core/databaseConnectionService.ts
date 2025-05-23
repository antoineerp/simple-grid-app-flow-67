
/**
 * Service de gestion de la connexion utilisateur - Version simplifiée
 * Utilise le service de base de données centralisé
 */

let currentUser: string = 'p71x6d_richard';

/**
 * Récupère l'utilisateur actuel
 */
export const getCurrentUser = (): string => {
  return currentUser;
};

/**
 * Définit l'utilisateur actuel
 */
export const setCurrentUser = (userId: string): void => {
  currentUser = userId;
  
  // Émettre un événement pour notifier les composants
  window.dispatchEvent(new CustomEvent('userChanged', { 
    detail: { userId } 
  }));
};

/**
 * Récupère l'utilisateur actuel depuis la connexion à la base de données
 */
export const getDatabaseConnectionCurrentUser = (): string => {
  return getCurrentUser();
};
