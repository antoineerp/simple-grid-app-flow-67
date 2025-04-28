
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

// Fonction pour obtenir l'utilisateur actuel de la connexion à la base de données
export const getDatabaseConnectionCurrentUser = (): string | null => {
  return localStorage.getItem('currentDatabaseUser') || 'p71x6d_system';
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
    // Utiliser direct-db-test.php pour tester la connexion réelle
    const response = await fetch('/api/direct-db-test.php');
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erreur de connexion à la base de données:", errorData.message || response.statusText);
      return false;
    }
    const result = await response.json();
    return result.status === 'success';
  } catch (error) {
    console.error("Erreur lors du test de connexion à la base de données:", error);
    return false;
  }
};

// Fonction pour récupérer les informations de la base de données
export const getDatabaseInfo = async (): Promise<DatabaseInfo> => {
  try {
    const currentUser = getDatabaseConnectionCurrentUser();
    // Appel direct au diagnostic de base de données pour obtenir des informations réelles
    const response = await fetch('/api/direct-db-test.php');
    
    // Si la requête échoue, lancer une erreur
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erreur de connexion à la base de données: ${response.statusText}`);
    }
    
    // Essayer d'analyser la réponse JSON
    const data = await response.json();
    
    if (data.status !== 'success') {
      throw new Error(data.message || "Échec de la récupération des informations de la base de données");
    }
    
    // Extraire et formater les informations de la base de données
    return {
      host: currentUser ? `${currentUser}.myd.infomaniak.com` : data.host || 'p71x6d.myd.infomaniak.com',
      database: currentUser || data.database || 'p71x6d_system',
      size: data.size || '0 MB',
      tables: data.tables ? data.tables.length : 0,
      lastBackup: new Date().toISOString().split('T')[0] + ' 00:00:00',
      status: data.status === 'success' ? 'Online' : 'Offline',
      encoding: data.encoding || 'utf8mb4',
      collation: data.collation || 'utf8mb4_unicode_ci',
      tableList: data.tables || []
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des informations de la base de données:', error);
    // Lancer l'erreur pour la propager au composant appelant
    throw error;
  }
};
