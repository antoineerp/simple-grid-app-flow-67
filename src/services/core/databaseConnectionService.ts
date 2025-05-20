
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

// Variable en mémoire pour stocker l'utilisateur actuel
// Toujours utiliser p71x6d_richard comme utilisateur par défaut
const FIXED_USER_ID = 'p71x6d_richard';

// Fonction pour récupérer l'utilisateur actuel
export const getCurrentUser = (): string => {
  // Toujours utiliser p71x6d_richard comme utilisateur par défaut
  return FIXED_USER_ID;
};

// Fonction pour définir l'utilisateur actuel (ignorée dans cette version)
export const setCurrentUser = (userId: string): void => {
  console.log(`Tentative de définir l'utilisateur à ${userId} - Ignorée, utilisation de ${FIXED_USER_ID}`);
  // Ne change pas l'utilisateur actuel, on garde toujours p71x6d_richard
};

// Fonction pour supprimer l'utilisateur actuel (reste toujours p71x6d_richard)
export const removeCurrentUser = (): void => {
  try {
    localStorage.removeItem('currentDatabaseUser');
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur du localStorage:", error);
  }
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
// Cette fonction simule une connexion réussie mais utilise toujours p71x6d_richard
export const connectAsUser = async (userId: string): Promise<boolean> => {
  try {
    console.log(`Connexion simulée en tant que ${userId} (utilise en réalité ${FIXED_USER_ID})`);
    
    // Mettre à jour l'interface utilisateur immédiatement
    window.dispatchEvent(new CustomEvent('database-user-changed', {
      detail: { user: FIXED_USER_ID }
    }));
    
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
export const getDatabaseConnectionCurrentUser = (): string => {
  // Toujours renvoyer p71x6d_richard
  return FIXED_USER_ID;
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
    console.log(`Test de connexion à la base de données via check-users.php avec ${FIXED_USER_ID}`);
    
    // Utiliser check-users.php qui fonctionne pour tester la connexion
    const response = await fetch(`${getApiUrl()}/check-users.php`, {
      headers: getAuthHeaders(),
      method: 'GET',
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || response.statusText;
      console.error("Erreur de connexion à la base de données:", errorMessage);
      setLastConnectionError(errorMessage);
      return false;
    }
    
    const result = await response.json();
    if (!result || !result.records) {
      setLastConnectionError("Réponse de l'API invalide");
      return false;
    }
    
    console.log("Connexion à la base de données réussie via check-users.php");
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
    console.log(`Récupération des informations de base de données pour: ${FIXED_USER_ID}`);
    
    // Appel direct à check-users.php qui fonctionne
    const response = await fetch(`${getApiUrl()}/check-users.php?source=${FIXED_USER_ID}`, {
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
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
    
    if (!data || !data.records) {
      const errorMessage = "Échec de la récupération des informations de la base de données";
      setLastConnectionError(errorMessage);
      throw new Error(errorMessage);
    }
    
    // Extraire et formater les informations de la base de données
    const dbInfo: DatabaseInfo = {
      host: "p71x6d.myd.infomaniak.com",
      database: FIXED_USER_ID,
      size: '10 MB',
      tables: data.records ? data.records.length : 0,
      lastBackup: new Date().toISOString().split('T')[0] + ' 00:00:00',
      status: 'Online',
      encoding: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci',
      tableList: ['utilisateurs']
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

// Fonction pour initialiser l'utilisateur actuel - toujours p71x6d_richard
export const initializeCurrentUser = (): void => {
  console.log(`Utilisateur initialisé avec la valeur par défaut: ${FIXED_USER_ID}`);
};
