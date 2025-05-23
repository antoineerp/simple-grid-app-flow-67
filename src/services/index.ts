
// Index de tous les services de l'application
// Ce fichier centralise les exports pour faciliter les imports

// Exporter le service API principal et ses sous-services
export * from './api/apiService';

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
  // Ne pas réexporter ces fonctions pour éviter les conflits
  userService,
  // Ces fonctions sont déjà exportées directement dans userService
} from './users/userService';

// Note: Ces services seront progressivement migrés vers 
// l'architecture centralisée dans apiService.ts
