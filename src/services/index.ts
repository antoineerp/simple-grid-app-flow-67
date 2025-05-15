
// Re-export functions from other service files
export * from './core/userInitializationService';
export * from './documents';
export * from './users/createUserService';
export * from './users/userManager';

// Export du type Utilisateur
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

// Explicitement renommer les exports de getCurrentUser pour éviter l'ambiguïté
export { 
  getCurrentUser as getDatabaseConnectionCurrentUser,
  connectAsUser,
  getLastConnectionError,
  disconnectUser,
  testDatabaseConnection,
  getDatabaseInfo
} from './core/databaseConnectionService';

export { 
  getCurrentUser as getAuthCurrentUser,
  getIsLoggedIn,
  getAuthToken,
  login,
  logout
} from './auth/authService';
