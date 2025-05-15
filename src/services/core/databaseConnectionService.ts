
/**
 * Service de connexion à la base de données
 * Version simplifiée utilisant uniquement le serveur
 */

// Variable pour stocker l'utilisateur courant
let currentUser: string | null = null;

/**
 * Obtient l'utilisateur actuellement connecté
 */
export const getCurrentUser = (): string | null => {
  // Si l'utilisateur est déjà défini, le retourner
  if (currentUser) {
    return currentUser;
  }
  
  // Essayer de charger l'utilisateur depuis le stockage
  try {
    const storedUser = localStorage.getItem('current_user') || sessionStorage.getItem('current_user');
    if (storedUser) {
      currentUser = storedUser;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
  }
  
  return currentUser;
};

/**
 * Définit l'utilisateur actuellement connecté
 */
export const setCurrentUser = (userId: string | null): void => {
  currentUser = userId;
  
  // Sauvegarder l'utilisateur dans le stockage
  try {
    if (userId) {
      localStorage.setItem('current_user', userId);
      sessionStorage.setItem('current_user', userId);
    } else {
      localStorage.removeItem('current_user');
      sessionStorage.removeItem('current_user');
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'utilisateur:', error);
  }
  
  // Diffuser un événement pour informer les autres composants
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('database-user-changed', {
      detail: { user: userId }
    }));
  }
};

/**
 * Pour la compatibilité avec le code existant
 */
export const getDatabaseConnectionCurrentUser = getCurrentUser;
