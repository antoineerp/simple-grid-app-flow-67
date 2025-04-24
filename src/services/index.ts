
// Re-export functions from other service files
export * from './core/userInitializationService';
export * from './documents';
export * from './users/userService';
export * from './users/createUserService';

// Explicitement renommer les exports pour éviter l'ambiguïté
export { 
  getUserId as getDatabaseConnectionCurrentUser 
} from './core/databaseConnectionService';

export { 
  getUserId as getAuthCurrentUser,
  isUserLoggedIn,
  getUserInfo,
  logout
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
  id: number;
  nom: string;
  prenom: string;
  email: string;
  mot_de_passe: string;
  identifiant_technique: string;
  role: string;
  date_creation: string;
}
