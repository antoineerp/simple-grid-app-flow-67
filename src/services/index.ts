
// Re-export functions from other service files
export * from './core/userInitializationService';
export * from './documents';
export * from './users/userService';
export * from './users/createUserService';

// Explicitly renommer les exports pour éviter l'ambiguïté
export { 
  connectAsUser,
  getLastConnectionError,
  disconnectUser,
  testDatabaseConnection,
  getDatabaseInfo,
  getCurrentUser as getDatabaseConnectionCurrentUser
} from './core/databaseConnectionService';

export { 
  getUserId as getAuthCurrentUser,
  isUserLoggedIn,
  getUserInfo,
  logout,
  getAuthHeaders,
  login
} from './auth/authService';

// Define types here if needed
export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  mot_de_passe: string;
  identifiant_technique: string;
  role: string;
  date_creation: string;
}
