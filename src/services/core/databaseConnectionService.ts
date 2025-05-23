
/**
 * Service de gestion de la connexion utilisateur - Version directe à la base de données
 * Évite l'utilisation du localStorage pour stocker les données utilisateurs
 */

import { fetchWithErrorHandling } from '@/config/apiConfig';
import { getApiUrl } from '@/config/apiConfig';

let currentUser: string = 'p71x6d_richard';
let lastConnectionError: string | null = null;

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

  // Émettre un événement spécifique pour la base de données
  window.dispatchEvent(new CustomEvent('database-user-changed', { 
    detail: { user: userId } 
  }));
};

/**
 * Récupère l'utilisateur actuel depuis la connexion à la base de données
 */
export const getDatabaseConnectionCurrentUser = (): string => {
  return getCurrentUser();
};

/**
 * Se connecter en tant qu'utilisateur spécifique
 */
export const connectAsUser = async (userId: string): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    console.log(`Tentative de connexion directe à la base de données en tant que: ${userId}`);
    
    // Vérifier si l'utilisateur existe
    const response = await fetchWithErrorHandling(`${API_URL}/test.php?action=user_exists&userId=${userId}`);
    const userExists = response && response.success;
    
    if (!userExists) {
      lastConnectionError = `L'utilisateur ${userId} n'existe pas dans la base de données`;
      return false;
    }
    
    setCurrentUser(userId);
    lastConnectionError = null;
    return true;
  } catch (error) {
    lastConnectionError = error instanceof Error ? error.message : 'Erreur inconnue lors de la connexion';
    console.error('Erreur lors de la connexion en tant qu\'utilisateur:', error);
    return false;
  }
};

/**
 * Déconnecte l'utilisateur actuel
 */
export const disconnectUser = (): void => {
  setCurrentUser('');
};

/**
 * Récupère l'erreur de connexion
 */
export const getConnectionError = (): string | null => {
  return lastConnectionError;
};

/**
 * Récupère la dernière erreur de connexion
 */
export const getLastConnectionError = (): string | null => {
  return lastConnectionError;
};

/**
 * Teste la connexion à la base de données
 */
export const testDatabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const API_URL = getApiUrl();
    const response = await fetchWithErrorHandling(`${API_URL}/test.php?action=test_connection`);
    
    return {
      success: response && response.success,
      message: response && response.message ? response.message : 'Test de connexion effectué'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue lors du test de connexion'
    };
  }
};

/**
 * Récupère les informations de la base de données
 */
export const getDatabaseInfo = async (): Promise<any> => {
  try {
    const connectionTest = await testDatabaseConnection();
    
    if (!connectionTest.success) {
      return {
        status: 'error',
        message: connectionTest.message,
        database: null,
        user: null
      };
    }
    
    return {
      status: 'success',
      message: 'Connexion à la base de données réussie',
      database: DB_CONFIG.dbname,
      user: getCurrentUser(),
      host: DB_CONFIG.host
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      database: null,
      user: null
    };
  }
};

/**
 * Vérifie si l'utilisateur est un utilisateur système
 */
export const isSystemUser = (userId: string): boolean => {
  return userId === 'p71x6d_admin' || userId === 'p71x6d_system';
};

/**
 * Force l'utilisation d'un utilisateur sûr si l'utilisateur actuel n'est pas valide
 */
export const forceSafeUser = async (): Promise<boolean> => {
  try {
    const defaultUser = 'p71x6d_richard';
    const user = getCurrentUser();
    
    if (!user) {
      setCurrentUser(defaultUser);
      return true;
    }
    
    const API_URL = getApiUrl();
    const response = await fetchWithErrorHandling(`${API_URL}/test.php?action=user_exists&userId=${user}`);
    const userExists = response && response.success;
    
    if (!userExists) {
      setCurrentUser(defaultUser);
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la vérification utilisateur:', error);
    return false;
  }
};

// Configuration fixe pour Infomaniak - à garder synchronisée avec database.ts
const DB_CONFIG = {
  host: "p71x6d.myd.infomaniak.com",
  dbname: "p71x6d_system", 
  username: "p71x6d_richard",
  password: "Trottinette43!"
};
