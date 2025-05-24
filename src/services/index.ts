
// Index de tous les services de l'application
// Ce fichier centralise les exports pour faciliter les imports

// Exporter le service API principal et ses sous-services
export * from './api/apiService';
export * from './api/directDbService';

// Réexporter les services existants, mais renommer l'authService importé
// pour éviter le conflit avec celui de apiService
export { 
  getIsLoggedIn,
  checkAuth,
  getAuthHeaders,
  getCurrentUser,
  logout,
  login,
  // Renommer authService pour éviter le conflit
  authService as authServiceLegacy 
} from './auth/authService';

// Export direct du service utilisateur pour éviter les conflits
export { 
  getUser,
  updateUser,
  deleteUser,
  getAllUsers,
  createUser,
  // Exporter ces fonctions spécifiquement pour qu'elles soient disponibles
  clearUsersCache,
  connectAsUser,
  verifyAllUserTables,
  // Export du service complet
  userService
} from './users/userService';

// Note: Ces services sont maintenant configurés pour toujours se connecter directement
// à la base de données Infomaniak et ne jamais utiliser le localStorage pour les données
