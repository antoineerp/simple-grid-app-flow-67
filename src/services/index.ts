
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

// Exports from userService with explicit naming to avoid conflicts
// Avoid re-exporting items already exported from './api/apiService'
export { 
  getUser,
  updateUser,
  deleteUser,
  getAllUsers,
  createUser,
  // Re-exporting with legacy naming to maintain compatibility while avoiding conflicts
  userService as userServiceLegacy 
} from './users/userService';

// Export centralized versions of utility functions
// These declarations replace the duplicate declarations that were causing errors
export { connectAsUser, clearUsersCache, verifyAllUserTables } from './users/userService';

// Note: Ces services seront progressivement migrés vers 
// l'architecture centralisée dans apiService.ts
