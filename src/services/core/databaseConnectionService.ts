
/**
 * Service de connexion à la base de données
 * Ce service gère la connexion à la base de données et les utilisateurs
 */

import { safeLocalStorageGet, safeLocalStorageSet, safeLocalStorageRemove } from '@/utils/syncStorageCleaner';

// Clé pour stocker l'utilisateur actuel dans le localStorage
const CURRENT_USER_KEY = 'current_database_user';
const CONNECTION_ERROR_KEY = 'database_connection_error';

// Préfixe pour les bases de données Infomaniak
const DB_PREFIX = 'p71x6d_';

// Fonction pour obtenir l'utilisateur actuel
export const getCurrentUser = (): string | null => {
  try {
    return safeLocalStorageGet<string>(CURRENT_USER_KEY, null);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur actuel:', error);
    return null;
  }
};

// Fonction pour définir l'utilisateur actuel
export const setCurrentUser = (userId: string): boolean => {
  try {
    // S'assurer que l'ID utilisateur a le bon préfixe
    const formattedUserId = userId.startsWith(DB_PREFIX) ? userId : `${DB_PREFIX}${userId}`;
    safeLocalStorageSet(CURRENT_USER_KEY, formattedUserId);
    console.log(`Utilisateur défini: ${formattedUserId}`);
    
    // Déclencher un événement pour informer l'application du changement d'utilisateur
    window.dispatchEvent(new CustomEvent('user-changed', {
      detail: { userId: formattedUserId }
    }));
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la définition de l\'utilisateur actuel:', error);
    return false;
  }
};

// Fonction pour obtenir l'utilisateur connecté pour la connexion à la base de données
export const getDatabaseConnectionCurrentUser = (): string | null => {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    console.warn('Aucun utilisateur défini, utilisation du compte système par défaut');
    return `${DB_PREFIX}system`;
  }
  
  return currentUser;
};

// Base URL pour l'API
export const getApiBaseUrl = (): string => {
  // On peut éventuellement adapter l'URL en fonction de l'environnement
  return 'https://api.infomaniak-system.net';
};

// Fonction pour obtenir l'URL complète de l'API pour un utilisateur spécifique
export const getUserApiUrl = (endpoint: string, userId?: string): string => {
  const baseUrl = getApiBaseUrl();
  let user = userId || getDatabaseConnectionCurrentUser() || `${DB_PREFIX}system`;
  
  // S'assurer que l'ID utilisateur a le bon préfixe
  if (!user.startsWith(DB_PREFIX)) {
    user = `${DB_PREFIX}${user}`;
  }
  
  // Construit l'URL avec l'utilisateur intégré
  return `${baseUrl}/users/${user}/${endpoint}`;
};

// Fonction pour obtenir les en-têtes d'authentification pour une requête API
export const getApiAuthHeaders = (userId?: string): Record<string, string> => {
  let user = userId || getDatabaseConnectionCurrentUser() || `${DB_PREFIX}system`;
  
  // S'assurer que l'ID utilisateur a le bon préfixe
  if (!user.startsWith(DB_PREFIX)) {
    user = `${DB_PREFIX}${user}`;
  }
  
  // Simule un token d'authentification basé sur l'ID utilisateur
  // Dans une application réelle, vous utiliseriez un véritable système d'authentification
  const dummyToken = btoa(`user-${user}-${Date.now()}`);
  
  return {
    'Authorization': `Bearer ${dummyToken}`,
    'X-User-ID': user
  };
};

// Fonction pour initialiser la connexion à la base de données
export const initializeDatabaseConnection = (userId: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    try {
      // S'assurer que l'ID utilisateur a le bon préfixe
      const formattedUserId = userId.startsWith(DB_PREFIX) ? userId : `${DB_PREFIX}${userId}`;
      
      // Définir l'utilisateur actuel
      setCurrentUser(formattedUserId);
      
      // Simuler une initialisation de connexion
      setTimeout(() => {
        console.log(`Connexion à la base de données initialisée pour l'utilisateur ${formattedUserId}`);
        
        // Déclencher un événement pour informer l'application
        window.dispatchEvent(new CustomEvent('database-initialized', {
          detail: { userId: formattedUserId, success: true }
        }));
        
        resolve(true);
      }, 500);
    } catch (error) {
      console.error(`Erreur lors de l'initialisation de la connexion pour ${userId}:`, error);
      reject(error);
    }
  });
};

// Fonction pour stocker une erreur de connexion
export const setConnectionError = (error: string): void => {
  safeLocalStorageSet(CONNECTION_ERROR_KEY, error);
};

// Fonction pour obtenir la dernière erreur de connexion
export const getLastConnectionError = (): string | null => {
  return safeLocalStorageGet<string>(CONNECTION_ERROR_KEY, null);
};

// Fonction pour initialiser l'utilisateur courant
export const initializeCurrentUser = (): string | null => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.warn("Pas d'utilisateur actuel défini, utilisation de l'utilisateur système");
    return `${DB_PREFIX}system`;
  }
  
  // Déclencher un événement pour informer que l'utilisateur est initialisé
  window.dispatchEvent(new CustomEvent('database-user-initialized', {
    detail: { user: currentUser }
  }));
  
  return currentUser;
};

// Fonction pour connecter en tant qu'utilisateur spécifique
export const connectAsUser = async (userId: string): Promise<boolean> => {
  try {
    // S'assurer que l'ID utilisateur a le bon préfixe
    const formattedUserId = userId.startsWith(DB_PREFIX) ? userId : `${DB_PREFIX}${userId}`;
    
    // Effacer les erreurs précédentes
    setConnectionError('');
    
    // Initialiser la connexion
    await initializeDatabaseConnection(formattedUserId);
    
    // Déclencher un événement pour informer du changement d'utilisateur
    window.dispatchEvent(new CustomEvent('database-user-changed', {
      detail: { user: formattedUserId }
    }));
    
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    setConnectionError(errorMessage);
    console.error(`Erreur lors de la connexion en tant que ${userId}:`, errorMessage);
    return false;
  }
};

// Fonction pour déconnecter l'utilisateur actuel
export const disconnectUser = (): void => {
  safeLocalStorageRemove(CURRENT_USER_KEY);
  
  // Déclencher un événement pour informer de la déconnexion
  window.dispatchEvent(new CustomEvent('database-user-changed', {
    detail: { user: null }
  }));
  
  console.log("Utilisateur déconnecté");
};

// Fonction pour tester la connexion à la base de données
export const testDatabaseConnection = async (userId?: string): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  let user = userId || getDatabaseConnectionCurrentUser() || `${DB_PREFIX}system`;
  
  // S'assurer que l'ID utilisateur a le bon préfixe
  if (!user.startsWith(DB_PREFIX)) {
    user = `${DB_PREFIX}${user}`;
  }
  
  try {
    // Simuler un test de connexion
    console.log(`Test de connexion pour l'utilisateur ${user}...`);
    
    // Attente simulée pour un test de connexion
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: `Connexion réussie pour l'utilisateur ${user}`,
      details: {
        user,
        timestamp: new Date().toISOString(),
        server: 'infomaniak-system.net'
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    setConnectionError(errorMessage);
    
    return {
      success: false,
      message: `Échec de la connexion pour l'utilisateur ${user}: ${errorMessage}`,
      details: { error: errorMessage }
    };
  }
};

// Fonction pour obtenir les informations de la base de données
export const getDatabaseInfo = async (userId?: string): Promise<{
  host: string;
  database: string;
  status: string;
  size: string;
  tables: number;
  lastBackup: string;
  encoding?: string;
  collation?: string;
  tableList?: string[];
}> => {
  let user = userId || getDatabaseConnectionCurrentUser() || `${DB_PREFIX}system`;
  
  // S'assurer que l'ID utilisateur a le bon préfixe
  if (!user.startsWith(DB_PREFIX)) {
    user = `${DB_PREFIX}${user}`;
  }
  
  try {
    // Simuler un appel API pour obtenir les informations
    console.log(`Récupération des informations pour l'utilisateur ${user}...`);
    
    // Dans un cas réel, on ferait un appel API vers le backend
    const tableList = [
      'users', 'exigences', 'documents', 'groups', 'settings', 
      'sync_logs', 'user_preferences', 'collaborations'
    ];
    
    return {
      host: `${user}.myd.infomaniak.com`,
      database: user,
      status: 'Online',
      size: '4.2 MB',
      tables: tableList.length,
      lastBackup: new Date().toISOString(),
      encoding: 'UTF-8',
      collation: 'utf8mb4_unicode_ci',
      tableList
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Erreur lors de la récupération des informations de la base de données:`, errorMessage);
    
    return {
      host: 'Unknown',
      database: user,
      status: 'Error',
      size: 'Unknown',
      tables: 0,
      lastBackup: 'Never',
      encoding: 'Unknown',
      collation: 'Unknown',
      tableList: []
    };
  }
};
