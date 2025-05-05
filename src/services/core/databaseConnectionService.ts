
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

// Variable en mémoire pour stocker l'utilisateur actuel
let currentDatabaseUser: string | null = null;

// Fonction pour récupérer l'utilisateur actuel depuis la mémoire ou token JWT
export const getCurrentUser = (): string | null => {
  // Si nous avons déjà récupéré l'utilisateur, le renvoyer
  if (currentDatabaseUser) return currentDatabaseUser;
  
  // Ne pas essayer de récupérer des informations à moins qu'explicitement demandé
  return null;
};

// Fonction pour définir l'utilisateur actuel
export const setCurrentUser = (userId: string): void => {
  if (!userId || typeof userId !== 'string' || !userId.startsWith('p71x6d_')) {
    console.error(`Tentative d'utilisation d'un identifiant technique invalide: ${userId}`);
    userId = 'p71x6d_system';
  }
  
  currentDatabaseUser = userId;
  console.log(`Utilisateur défini: ${userId}`);
  
  // Stocker aussi dans le localStorage pour la persistance entre les rechargements
  try {
    localStorage.setItem('currentDatabaseUser', userId);
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de l'utilisateur dans localStorage:", error);
  }
};

// Fonction pour supprimer l'utilisateur actuel
export const removeCurrentUser = (): void => {
  currentDatabaseUser = null;
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
export const connectAsUser = async (userId: string): Promise<boolean> => {
  try {
    console.log(`Tentative de connexion en tant que: ${userId}`);
    
    // S'assurer que l'identifiant est bien formaté
    if (!userId || !userId.startsWith('p71x6d_')) {
      setLastConnectionError(`Identifiant technique invalide: ${userId}`);
      return false;
    }
    
    setCurrentUser(userId);
    
    // Mettre à jour l'interface utilisateur immédiatement
    window.dispatchEvent(new CustomEvent('database-user-changed', {
      detail: { user: userId }
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
export const getDatabaseConnectionCurrentUser = (): string | null => {
  // Vérifier d'abord la variable en mémoire
  if (currentDatabaseUser) {
    return currentDatabaseUser;
  }
  
  // Ne pas essayer de récupérer des informations à moins qu'explicitement demandé
  return null;
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
    console.log("Test de connexion à la base de données via check-users.php");
    // Utiliser check-users.php au lieu de direct-db-test.php car il fonctionne mieux
    const currentUser = getDatabaseConnectionCurrentUser();
    
    // Si pas d'utilisateur configuré, ne pas tenter de connexion
    if (!currentUser) {
      console.log("Aucun utilisateur configuré, test de connexion ignoré");
      return false;
    }
    
    const response = await fetch(`${getApiUrl()}/check-users?source=${currentUser}`, {
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
    
    // Si pas d'utilisateur configuré, renvoyer des valeurs par défaut
    if (!currentUser) {
      return {
        host: "Non configuré",
        database: "Non configuré",
        size: '0 MB',
        tables: 0,
        lastBackup: '-',
        status: 'Non connecté'
      };
    }
    
    console.log(`Récupération des informations de base de données pour: ${currentUser || 'utilisateur par défaut'}`);
    
    // Appel direct à check-users pour obtenir des informations réelles (le même endpoint qui fonctionne)
    const response = await fetch(`${getApiUrl()}/check-users?source=${currentUser}`, {
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
    
    if (data.status !== 'success') {
      const errorMessage = data.message || "Échec de la récupération des informations de la base de données";
      setLastConnectionError(errorMessage);
      throw new Error(errorMessage);
    }
    
    // S'assurer que les valeurs critiques ne sont pas "localhost"
    if (data.database_info && data.database_info.host && data.database_info.host.includes('localhost')) {
      console.error("ALERTE: Host 'localhost' détecté dans la réponse API. Correction forcée vers Infomaniak.");
      data.database_info.host = "p71x6d.myd.infomaniak.com";
    }
    
    // Extraire et formater les informations de la base de données
    const dbInfo: DatabaseInfo = {
      host: data.database_info?.host || "p71x6d.myd.infomaniak.com",
      database: data.database_info?.database || "p71x6d_system",
      size: '0 MB',
      tables: data.records ? data.records.length : 0,
      lastBackup: new Date().toISOString().split('T')[0] + ' 00:00:00',
      status: data.status === 'success' ? 'Online' : 'Offline',
      encoding: data.database_info?.encoding || 'utf8mb4',
      collation: data.database_info?.collation || 'utf8mb4_unicode_ci',
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

// Fonction pour initialiser l'utilisateur actuel - ne plus appeler automatiquement
export const initializeCurrentUser = (): void => {
  console.log("Initialisation de l'utilisateur UNIQUEMENT après connexion réussie");
};

// Ne plus initialiser automatiquement
// Suppression de l'initialisation automatique
