
// Re-export functions from other service files
export * from './core/databaseConnectionService';
export * from './core/userInitializationService';
export * from './documents';
export * from './users/userService';
export * from './users/createUserService';
export * from './auth/authService';

// Explicitly re-export with a different name to resolve ambiguity
export { 
  getCurrentUser as getDatabaseConnectionCurrentUser 
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
