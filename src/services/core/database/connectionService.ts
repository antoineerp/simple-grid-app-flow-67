
// Database connection service
let currentUser: string | null = null;
let lastConnectionError: string | null = null;

export const getCurrentUser = (): string | null => currentUser;
export const getLastConnectionError = (): string | null => lastConnectionError;

// Fonctions pour mettre à jour les variables d'état internes
export const setCurrentUser = (user: string | null) => {
  currentUser = user;
  if (user) {
    console.log(`Utilisateur de base de données mis à jour: ${user}`);
  } else {
    console.log("Déconnexion de l'utilisateur de base de données");
  }
};

export const setLastConnectionError = (error: string | null) => {
  lastConnectionError = error;
  if (error) {
    console.error(`Erreur de connexion à la base de données: ${error}`);
  }
};
