
/**
 * Service de connexion à la base de données
 * Version unifiée - Utilise uniquement des endpoints fiables
 */

import { getApiUrl } from '@/config/apiConfig';

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
 * ENDPOINT UNIFIÉ: Utilise uniquement test-db-connection.php qui fonctionne déjà
 */
export const testDatabaseConnection = async (): Promise<{success: boolean, message: string}> => {
  try {
    const API_URL = getApiUrl();
    // Utiliser uniquement l'endpoint qui fonctionne déjà
    const response = await fetch(`${API_URL}/test-db-connection.php`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const result = await response.json();
    console.log("Résultat du test de connexion:", result);
    
    // Vérifier que le statut est positif
    if (result.status === 'success') {
      return {
        success: true,
        message: result.message || "Connexion à la base de données réussie"
      };
    } else {
      throw new Error(result.message || "Échec de la connexion à la base de données");
    }
  } catch (error) {
    console.error("Erreur lors du test de connexion:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur de connexion à la base de données"
    };
  }
};

/**
 * Obtenir des informations sur la base de données
 * ENDPOINT UNIFIÉ: Utilise uniquement test-db-connection.php qui fonctionne déjà
 */
export const getDatabaseInfo = async (): Promise<any> => {
  try {
    const API_URL = getApiUrl();
    // Utiliser uniquement l'endpoint qui fonctionne déjà
    const response = await fetch(`${API_URL}/test-db-connection.php`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Formater les informations pour compatibilité avec l'interface DatabaseInfo
    return {
      host: result.database?.host || "Base de données distante",
      database: result.database?.name || "N/A",
      size: "N/A",
      tables: result.tables?.utilisateurs_count || 0,
      lastBackup: new Date().toISOString().split('T')[0] + ' 00:00:00',
      status: result.status === 'success' ? 'Online' : 'Offline',
      encoding: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci',
      tableList: []
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des informations de la base de données:", error);
    throw error;
  }
};

/**
 * Pour la compatibilité avec le code existant
 */
export const getDatabaseConnectionCurrentUser = getCurrentUser;
