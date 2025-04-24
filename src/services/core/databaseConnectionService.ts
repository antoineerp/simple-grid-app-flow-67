
// Service pour gérer la connexion à la base de données

// Récupérer l'utilisateur actuel connecté à la base de données
export const getDatabaseConnectionCurrentUser = (): string | null => {
  return localStorage.getItem('currentDatabaseUser') || null;
};

// Définir l'utilisateur actuel connecté à la base de données
export const setDatabaseConnectionCurrentUser = (user: string | null): void => {
  if (user) {
    localStorage.setItem('currentDatabaseUser', user);
  } else {
    localStorage.removeItem('currentDatabaseUser');
  }
};

// Vérifier si un utilisateur est connecté à la base de données
export const isConnectedToDatabase = (): boolean => {
  return !!getDatabaseConnectionCurrentUser();
};
