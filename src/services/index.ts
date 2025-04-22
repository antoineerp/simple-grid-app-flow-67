
// This is the main entry point for all services
// It re-exports all the functions from the various services

// Export from database connection service
export { 
  connectAsUser,
  getCurrentUser,
  disconnectUser,
  testDatabaseConnection,
  getDatabaseInfo,
  getLastConnectionError,
  type DatabaseInfo
} from './core/databaseConnectionService';

// Export from auth service
export {
  login as loginUser,
  logout as logoutUser,
  getToken,
  getAuthHeaders
} from './auth/authService';

// Export from user service
export {
  getUtilisateurs,
  type Utilisateur
} from './users/userService';
