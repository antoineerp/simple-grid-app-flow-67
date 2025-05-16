
// Ce fichier sert de point d'entrée pour tous les services
// Exporter les services publiquement pour les autres modules

// Services d'authentification
export {
  getAuthToken,
  getCurrentUser,
  getCurrentUserId,
  getCurrentUserName,
  isAuthenticated,
  isAdmin,
  login,
  logout,
  getAuthHeaders,
  hasRole,
  getIsLoggedIn,
  validateAndFixToken,
  authenticateUser
} from './auth/authService';

// Export des services de gestion de la base de données
export {
  getCurrentUser as getDatabaseConnectionCurrentUser,
  setCurrentUser,
  connectAsUser,
  getLastConnectionError,
  disconnectUser,
  testDatabaseConnection,
  getDatabaseInfo,
  initializeCurrentUser
} from './core/databaseConnectionService';

// Export du service UserManager
export {
  clearUsersCache,
  refreshUtilisateurs,
  synchronizeUsers
} from './users/userManager';

// Export des services de synchronisation
export {
  startEntitySync,
  getSyncStatus,
  triggerSync,
  triggerSyncAll,
  triggerTableSync,
  syncService
} from './sync';

// Autres services peuvent être importés et réexportés ici
