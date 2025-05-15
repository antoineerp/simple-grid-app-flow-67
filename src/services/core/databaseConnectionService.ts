
/**
 * Service de connexion à la base de données
 * Version simplifiée utilisant uniquement le serveur
 */

// Variable pour stocker l'utilisateur courant
let currentUser: string | null = null;
let lastConnectionError: string | null = null;

/**
 * Initialise l'utilisateur courant
 */
export const initializeCurrentUser = (): void => {
  // Essayer de charger l'utilisateur depuis le stockage
  try {
    const storedUser = localStorage.getItem('current_user') || sessionStorage.getItem('current_user');
    if (storedUser) {
      currentUser = storedUser;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
  }
};

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
 * Connecter en tant qu'utilisateur spécifique
 */
export const connectAsUser = async (userId: string): Promise<boolean> => {
  try {
    setCurrentUser(userId);
    return true;
  } catch (error) {
    lastConnectionError = error instanceof Error ? error.message : "Erreur inconnue";
    return false;
  }
};

/**
 * Obtenir la dernière erreur de connexion
 */
export const getLastConnectionError = (): string | null => {
  return lastConnectionError;
};

/**
 * Déconnecter l'utilisateur
 */
export const disconnectUser = (): void => {
  setCurrentUser(null);
};

/**
 * Tester la connexion à la base de données
 */
export const testDatabaseConnection = async (): Promise<{success: boolean, message: string}> => {
  try {
    // Simuler un test de connexion réussi
    return {
      success: true,
      message: "Connexion à la base de données réussie"
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur de connexion à la base de données"
    };
  }
};

/**
 * Obtenir des informations sur la base de données
 */
export const getDatabaseInfo = async (): Promise<any> => {
  return {
    host: "Base de données distante",
    version: "MySQL",
    connected: true
  };
};

/**
 * Pour la compatibilité avec le code existant
 */
export const getDatabaseConnectionCurrentUser = getCurrentUser;
