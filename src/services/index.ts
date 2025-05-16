
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

// Autres services peuvent être importés et réexportés ici
