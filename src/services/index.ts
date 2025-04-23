
// Re-export functions from other service files
export * from './core/userInitializationService';
export * from './documents';
export * from './users/userService';
export * from './users/createUserService';

// Explicitement renommer les exports de getCurrentUser pour éviter l'ambiguïté
export { 
  getCurrentUser as getDatabaseConnectionCurrentUser 
} from './core/databaseConnectionService';

export { 
  getCurrentUser as getAuthCurrentUser 
} from './auth/authService';

// Re-export other functions from databaseConnectionService
export {
  connectAsUser,
  getLastConnectionError,
  disconnectUser,
  testDatabaseConnection,
  getDatabaseInfo,
  getPhpMyAdminUrl
} from './core/databaseConnectionService';

// Define types here if needed
export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  identifiant_technique: string;
  role: string;
  date_creation: string;
}
