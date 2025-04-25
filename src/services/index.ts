
// Re-export functions from other service files
export * from './core/userInitializationService';
export * from './documents';
export * from './users/userService';
export * from './users/createUserService';
export * from './sync/userProfileSync';

// Nous n'avons plus besoin de ces renommages car les fonctions sont maintenant
// directement exportées depuis les fichiers sources
export { 
  getDatabaseConnectionCurrentUser,
  getCurrentUser,
  setDatabaseConnectionCurrentUser,
  isConnectedToDatabase,
  connectAsUser,
  disconnectUser,
  getLastConnectionError,
  testDatabaseConnection,
  getDatabaseInfo
} from './core/databaseConnectionService';

export { 
  getCurrentUser as getAuthCurrentUser 
} from './auth/authService';

// Define types here if needed
export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  mot_de_passe: string; // Added this property to fix the TypeScript error
  identifiant_technique: string;
  role: string;
  date_creation: string;
}
