
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

let lastConnectionError: string | null = null;
let currentUser: string | null = null;

/**
 * Récupère l'utilisateur actuellement connecté à la base de données
 */
export const getCurrentUser = (): string | null => {
  if (!currentUser) {
    currentUser = localStorage.getItem('databaseUser');
  }
  return currentUser;
};

/**
 * Initialise l'utilisateur courant pour la connexion à la base de données
 */
export const initializeCurrentUser = (): void => {
  const userId = localStorage.getItem('userId');
  if (userId) {
    currentUser = userId;
    localStorage.setItem('databaseUser', userId);
  }
};

/**
 * Se connecter en tant qu'utilisateur spécifique
 */
export const connectAsUser = async (identifiantTechnique: string): Promise<boolean> => {
  try {
    console.log(`Tentative de connexion en tant que: ${identifiantTechnique}`);
    lastConnectionError = null;
    
    localStorage.setItem('databaseUser', identifiantTechnique);
    currentUser = identifiantTechnique;
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la connexion en tant qu'utilisateur:", error);
    lastConnectionError = error instanceof Error ? error.message : "Erreur inconnue lors de la connexion";
    return false;
  }
};

/**
 * Récupère la dernière erreur de connexion
 */
export const getLastConnectionError = (): string | null => {
  return lastConnectionError;
};

/**
 * Déconnecte l'utilisateur actuel
 */
export const disconnectUser = (): void => {
  localStorage.removeItem('databaseUser');
  currentUser = null;
};

/**
 * Teste la connexion à la base de données
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/db-test.php`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return data.success || false;
  } catch (error) {
    console.error("Erreur lors du test de connexion:", error);
    return false;
  }
};

/**
 * Récupère les informations sur la base de données
 */
export const getDatabaseInfo = async (): Promise<any> => {
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/db-info.php`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération des informations:", error);
    return { error: 'Impossible de récupérer les informations de la base de données' };
  }
};
