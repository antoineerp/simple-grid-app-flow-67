
// Index de tous les services de l'application
// Ce fichier centralise les exports pour faciliter les imports

// Exporter le service API principal
export * from './api/apiService';

// Exporter les services d'authentification
export { authService } from './auth';

// Export direct du service utilisateur pour éviter les conflits
export { 
  getUser,
  updateUser,
  deleteUser,
  getAllUsers,
  createUser,
  clearUsersCache,
  connectAsUser,
  verifyAllUserTables,
  userService
} from './users/userService';

// Note: Ces services sont maintenant configurés pour toujours se connecter directement
// à la base de données Infomaniak et ne jamais utiliser le localStorage pour les données
