
// Fonction pour récupérer l'utilisateur actuel depuis localStorage ou mémoire
export const getCurrentUser = (): string | null => {
  return localStorage.getItem('currentUser') || 'p71x6d_system';
};

// Fonction pour définir l'utilisateur actuel
export const setCurrentUser = (userId: string): void => {
  localStorage.setItem('currentDatabaseUser', userId);
  localStorage.setItem('currentUser', userId);
};

// Fonction pour supprimer l'utilisateur actuel
export const removeCurrentUser = (): void => {
  localStorage.removeItem('currentDatabaseUser');
  localStorage.removeItem('currentUser');
};

// Variable pour stocker la dernière erreur de connexion
let lastConnectionError: string | null = null;

// Fonction pour obtenir la dernière erreur de connexion
export const getLastConnectionError = (): string | null => {
  return lastConnectionError;
};

// Fonction pour définir la dernière erreur de connexion
export const setLastConnectionError = (error: string): void => {
  lastConnectionError = error;
};
