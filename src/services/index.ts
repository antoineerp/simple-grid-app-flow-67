
/**
 * Services exports centralisés
 * Ce fichier regroupe toutes les exportations des services pour faciliter leur importation
 */

// Imports pour les réexportations
import { 
  getCurrentUser as getCurrentDbUser,
  getDatabaseConnectionCurrentUser,
  setCurrentUser,
  getApiBaseUrl,
  getUserApiUrl,
  getApiAuthHeaders,
  initializeDatabaseConnection,
  connectAsUser,
  getLastConnectionError,
  disconnectUser,
  testDatabaseConnection,
  getDatabaseInfo
} from './core/databaseConnectionService';

// Réexportations
export { getCurrentDbUser, getDatabaseConnectionCurrentUser, setCurrentUser };
export { getApiBaseUrl, getUserApiUrl, getApiAuthHeaders };
export { initializeDatabaseConnection };
export { connectAsUser, getLastConnectionError, disconnectUser };
export { testDatabaseConnection, getDatabaseInfo };

// Export de types depuis d'autres modules si nécessaire
export type { Utilisateur } from './users/types';

// Exportation de fonctions utilitaires
export const clearUsersCache = (): void => {
  localStorage.removeItem('users_cache');
  console.log('Cache utilisateurs nettoyé');
};

