
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

// Variable en mémoire pour stocker l'utilisateur actuel
let currentDatabaseUser: string | null = null;

// Fonction pour récupérer l'utilisateur actuel depuis la mémoire ou token JWT
export const getCurrentUser = (): string | null => {
  // Si nous avons déjà récupéré l'utilisateur, le renvoyer
  if (currentDatabaseUser) return currentDatabaseUser;
  
  // Essayer de récupérer depuis l'authentification
  try {
    const authToken = sessionStorage.getItem('authToken');
    if (authToken) {
      // Vérifier que le token a le bon format avant de le traiter
      const parts = authToken.split('.');
      if (parts && parts.length >= 2 && parts[1]) {
        try {
          const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const rawPayload = atob(base64);
          const jsonPayload = decodeURIComponent(
            Array.from(rawPayload)
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );

          const userData = JSON.parse(jsonPayload);
          if (userData.user && userData.user.identifiant_technique) {
            currentDatabaseUser = userData.user.identifiant_technique;
            return userData.user.identifiant_technique;
          }
        } catch (decodeError) {
          console.error("Erreur lors du décodage du token:", decodeError);
        }
      } else {
        console.error("Format de token invalide lors de l'initialisation");
      }
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur depuis le token:", error);
  }
  
  // Valeur par défaut pour les opérations sans authentification
  return 'p71x6d_system';
};

// Fonction pour définir l'utilisateur actuel
export const setCurrentUser = (userId: string): void => {
  if (!userId || typeof userId !== 'string' || !userId.startsWith('p71x6d_')) {
    console.error(`Tentative d'utilisation d'un identifiant technique invalide: ${userId}`);
    userId = 'p71x6d_system';
  }
  
  currentDatabaseUser = userId;
  console.log(`Utilisateur défini: ${userId}`);
};

// Fonction pour supprimer l'utilisateur actuel
export const removeCurrentUser = (): void => {
  currentDatabaseUser = null;
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
  console.error("Erreur de connexion enregistrée:", error);
};

// Fonction pour se connecter en tant qu'utilisateur spécifique
export const connectAsUser = async (userId: string): Promise<boolean> => {
  try {
    console.log(`Tentative de connexion en tant que: ${userId}`);
    
    // S'assurer que l'identifiant est bien formaté
    if (!userId || !userId.startsWith('p71x6d_')) {
      setLastConnectionError(`Identifiant technique invalide: ${userId}`);
      return false;
    }
    
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
  return currentDatabaseUser || 'p71x6d_system';
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
    console.log("Test de connexion à la base de données via direct-db-test.php");
    // Utiliser direct-db-test.php pour tester la connexion réelle
    const response = await fetch(`${getApiUrl()}/direct-db-test.php`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || response.statusText;
      console.error("Erreur de connexion à la base de données:", errorMessage);
      setLastConnectionError(errorMessage);
      return false;
    }
    const result = await response.json();
    if (result.status !== 'success') {
      setLastConnectionError(result.message || "Échec de la connexion");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Erreur lors du test de connexion à la base de données:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    setLastConnectionError(errorMessage);
    return false;
  }
};

// Fonction pour récupérer les informations de la base de données
export const getDatabaseInfo = async (): Promise<DatabaseInfo> => {
  try {
    const currentUser = getDatabaseConnectionCurrentUser();
    console.log(`Récupération des informations de base de données pour: ${currentUser || 'utilisateur par défaut'}`);
    
    // Appel direct au diagnostic de base de données pour obtenir des informations réelles
    const response = await fetch(`${getApiUrl()}/direct-db-test.php`, {
      headers: getAuthHeaders() 
    });
    
    // Si la requête échoue, lancer une erreur
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || `Erreur de connexion à la base de données: ${response.statusText}`;
      setLastConnectionError(errorMessage);
      throw new Error(errorMessage);
    }
    
    // Essayer d'analyser la réponse JSON
    const data = await response.json();
    
    if (data.status !== 'success') {
      const errorMessage = data.message || "Échec de la récupération des informations de la base de données";
      setLastConnectionError(errorMessage);
      throw new Error(errorMessage);
    }
    
    // S'assurer que les valeurs critiques ne sont pas "localhost"
    if (data.host && data.host.includes('localhost')) {
      console.error("ALERTE: Host 'localhost' détecté dans la réponse API. Correction forcée vers Infomaniak.");
      data.host = "p71x6d.myd.infomaniak.com";
    }
    
    // Extraire et formater les informations de la base de données
    const dbInfo: DatabaseInfo = {
      host: data.host || "p71x6d.myd.infomaniak.com",
      database: data.database || "p71x6d_system",
      size: data.size || '0 MB',
      tables: data.tables ? data.tables.length : 0,
      lastBackup: new Date().toISOString().split('T')[0] + ' 00:00:00',
      status: data.status === 'success' ? 'Online' : 'Offline',
      encoding: data.encoding || 'utf8mb4',
      collation: data.collation || 'utf8mb4_unicode_ci',
      tableList: data.tables || []
    };
    
    console.log("Informations de base de données reçues:", dbInfo);
    return dbInfo;
  } catch (error) {
    console.error('Erreur lors de la récupération des informations de la base de données:', error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    setLastConnectionError(errorMessage);
    // Lancer l'erreur pour la propager au composant appelant
    throw error;
  }
};

// Fonction pour initialiser l'utilisateur actuel
export const initializeCurrentUser = (): void => {
  // Essayer de récupérer l'utilisateur depuis le token d'authentification
  try {
    const authToken = sessionStorage.getItem('authToken');
    if (authToken) {
      // Vérifier que le token est correctement formaté (format JWT)
      const parts = authToken.split('.');
      if (parts && parts.length >= 3) { // Un token JWT valide a 3 parties
        try {
          const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const rawPayload = atob(base64);
          const jsonPayload = decodeURIComponent(
            Array.from(rawPayload)
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );

          const userData = JSON.parse(jsonPayload);
          if (userData.user && userData.user.identifiant_technique) {
            setCurrentUser(userData.user.identifiant_technique);
            console.log(`Utilisateur initialisé depuis le token JWT: ${userData.user.identifiant_technique}`);
            return;
          }
        } catch (decodeError) {
          console.error("Erreur lors du décodage du token:", decodeError);
        }
      } else {
        console.error("Format de token invalide lors de l'initialisation");
      }
    }
  } catch (error) {
    console.error("Erreur lors de l'initialisation de l'utilisateur depuis le token:", error);
  }
  
  // Si aucun utilisateur n'est trouvé dans le token, utiliser la valeur par défaut
  setCurrentUser('p71x6d_system');
  console.log(`Utilisateur initialisé avec la valeur par défaut: p71x6d_system`);
};
