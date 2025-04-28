
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

// Nouvelle fonction pour se connecter en tant qu'utilisateur spécifique
export const connectAsUser = async (userId: string): Promise<boolean> => {
  try {
    console.log(`Tentative de connexion en tant que: ${userId}`);
    setCurrentUser(userId);
    return true;
  } catch (error) {
    console.error("Erreur lors de la connexion en tant qu'utilisateur:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    setLastConnectionError(errorMessage);
    return false;
  }
};

// Fonction pour déconnecter l'utilisateur
export const disconnectUser = (): void => {
  removeCurrentUser();
  console.log("Utilisateur déconnecté de la base de données");
};

// Interface pour les informations de base de données
export interface DatabaseInfo {
  host: string;
  database: string;
  size: string;
  tables: number;
  lastBackup: string;
  status: string;
  encoding?: string;
  collation?: string;
  tableList?: string[];
}

// Fonction pour tester la connexion à la base de données
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    // Simuler un test de connexion réussi (à remplacer par une vraie implémentation)
    console.log("Test de connexion à la base de données");
    return true;
  } catch (error) {
    console.error("Erreur lors du test de connexion à la base de données:", error);
    return false;
  }
};

// Fonction pour récupérer les informations de la base de données
export const getDatabaseInfo = async (): Promise<DatabaseInfo> => {
  // Simuler des informations de base de données (à remplacer par une vraie implémentation)
  return {
    host: 'localhost',
    database: 'qualite_cloud',
    size: '5.2 MB',
    tables: 12,
    lastBackup: '2023-04-27 14:30:00',
    status: 'connected',
    encoding: 'utf8mb4',
    collation: 'utf8mb4_general_ci',
    tableList: ['utilisateurs', 'documents', 'exigences', 'membres']
  };
};
