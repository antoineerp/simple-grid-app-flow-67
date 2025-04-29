
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
  getDatabaseInfo
} from './core/databaseConnectionService';

// Define types here if needed
export interface Utilisateur {
  id: string; // Changed from number to string to match database schema
  nom: string;
  prenom: string;
  email: string;
  mot_de_passe: string;
  identifiant_technique: string;
  role: 'administrateur' | 'utilisateur' | 'gestionnaire'; // Restricted to match enum values
  date_creation: string;
}
