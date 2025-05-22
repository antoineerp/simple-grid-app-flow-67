import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { toast } from '@/components/ui/use-toast';
import { Utilisateur } from '@/types/auth';

// Variables pour stocker l'utilisateur connecté et l'état de la connexion
let currentUser: string | null = null;
let lastConnectionError: string | null = null;

// Constantes pour la validation
const RESTRICTED_IDS = ['system', 'admin', 'root', 'p71x6d_system', 'p71x6d_system2', '[object Object]', 'null', 'undefined'];
// Utilisation OBLIGATOIRE de cette constante pour TOUTES les connexions à la base de données
const ENFORCE_DB_USER = 'p71x6d_richard';
const ENFORCE_DB_NAME = 'p71x6d_richard';

/**
 * Vérifie si un ID est restreint/système
 */
const isRestrictedId = (id: string | null): boolean => {
  if (!id) return true;
  return RESTRICTED_IDS.includes(id) || id === 'null' || id === 'undefined';
}

/**
 * Vérifie si l'entrée est une adresse email
 */
const isEmail = (input: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

/**
 * Récupère l'identifiant de l'utilisateur actuellement connecté
 * TOUJOURS retourne p71x6d_richard
 */
export const getCurrentUser = (): string => {
  console.log("Demande d'utilisateur actuel, forcé à utiliser la base de données:", ENFORCE_DB_NAME);
  // TOUJOURS utiliser p71x6d_richard pour TOUTES les opérations
  return ENFORCE_DB_USER;
};

/**
 * Définit l'identifiant de l'utilisateur actuellement connecté
 * Note: L'identifiant original est stocké mais on FORCE l'utilisation de p71x6d_richard comme base
 */
export const setCurrentUser = (userId: string): void => {
  try {
    // Stocker l'ID original pour référence uniquement
    const originalId = userId || 'default';
    localStorage.setItem('originalUserId', originalId);
    
    // TOUJOURS forcer l'utilisation de p71x6d_richard pour la base de données
    currentUser = ENFORCE_DB_USER;
    
    // Stocker l'ID utilisateur sécurisé
    localStorage.setItem('userId', ENFORCE_DB_USER);
    localStorage.setItem('user_id', ENFORCE_DB_USER);
    
    // Stocker également un préfixe utilisateur pour distinguer les données
    const userPrefix = originalId.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 10);
    localStorage.setItem('userPrefix', userPrefix);
    
    console.log(`Identifiant utilisateur défini: ${userId} (forcé vers: ${ENFORCE_DB_USER}, préfixe: ${userPrefix})`);
  } catch (error) {
    console.error("Erreur lors de la définition de l'identifiant utilisateur:", error);
  }
};

/**
 * Récupère l'erreur de connexion la plus récente
 */
export const getConnectionError = (): string | null => {
  return lastConnectionError;
};

/**
 * Alias pour getConnectionError pour compatibilité
 */
export const getLastConnectionError = getConnectionError;

/**
 * Réinitialise l'état de connexion
 */
export const resetConnectionState = (): void => {
  lastConnectionError = null;
};

/**
 * Récupère l'URL API complète pour une ressource spécifique
 */
export const getApiResourceUrl = (resource: string): string => {
  const baseUrl = getApiUrl();
  return `${baseUrl}/${resource}`;
};

/**
 * Teste la connexion à la base de données sur le serveur
 */
export const testDatabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${getApiUrl()}/database-config.php`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Database-Force': ENFORCE_DB_USER // Ajouter un en-tête pour forcer l'utilisation de p71x6d_richard
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    
    // Vérifier que la bonne base est utilisée
    if (data.config && data.config.db_name !== ENFORCE_DB_NAME) {
      console.error(`ERREUR: Tentative d'utilisation d'une base non autorisée: ${data.config.db_name}`);
      return { 
        success: false, 
        message: `Seule la base ${ENFORCE_DB_NAME} est autorisée. Tentative d'utiliser: ${data.config.db_name}` 
      };
    }
    
    if (data.connection && data.connection.is_connected) {
      console.log("Connexion à la base de données réussie:", data.config);
      return { success: true, message: `Connecté à la base de données ${ENFORCE_DB_NAME}` };
    } else {
      const errorMsg = data.connection.error || "Impossible de se connecter à la base de données";
      console.error("Erreur de connexion:", errorMsg);
      lastConnectionError = errorMsg;
      return { success: false, message: errorMsg };
    }
  } catch (error) {
    console.error("Erreur lors du test de connexion:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    lastConnectionError = errorMessage;
    return { success: false, message: errorMessage };
  }
};

/**
 * Se connecte avec un identifiant utilisateur spécifique
 * Toujours force p71x6d_richard
 */
export const connectAsUser = async (userId: string): Promise<boolean> => {
  try {
    // TOUJOURS utiliser p71x6d_richard comme base, mais stocker l'ID original pour référence
    setCurrentUser(userId);
    
    toast({
      title: "Connexion réussie",
      description: `Connecté à la base de données ${ENFORCE_DB_NAME}`,
    });
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    
    toast({
      variant: "destructive",
      title: "Erreur de connexion",
      description: error instanceof Error ? error.message : "Erreur inconnue"
    });
    
    return false;
  }
};

/**
 * Déconnecte l'utilisateur (pour compatibilité avec le code existant)
 */
export const disconnectUser = async (): Promise<boolean> => {
  try {
    // Reset to default user
    currentUser = ENFORCE_DB_USER;
    localStorage.removeItem('originalUserId');
    localStorage.removeItem('userPrefix');
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    return false;
  }
};

/**
 * Vérifie si un utilisateur est un utilisateur système (pour compatibilité)
 */
export const isSystemUser = (userId: string): boolean => {
  return RESTRICTED_IDS.includes(userId);
};

/**
 * Force l'utilisation d'un utilisateur sécurisé (pour compatibilité)
 */
export const forceSafeUser = (): string => {
  return ENFORCE_DB_USER;
};

/**
 * Récupère des informations sur la base de données
 */
export const getDatabaseInfo = async (): Promise<any> => {
  try {
    const response = await fetch(`${getApiUrl()}/db-info.php`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la récupération des informations de la base de données:", error);
    return { error: true, message: error instanceof Error ? error.message : "Erreur inconnue" };
  }
};

/**
 * Alias pour getCurrentUser pour compatibilité API
 */
export const getDatabaseConnectionCurrentUser = getCurrentUser;

// Initialiser l'utilisateur au démarrage
export const initializeUser = () => {
  // TOUJOURS forcer p71x6d_richard comme base de données
  currentUser = ENFORCE_DB_USER;
  localStorage.setItem('userId', ENFORCE_DB_USER);
  localStorage.setItem('user_id', ENFORCE_DB_USER);
  console.log(`Utilisateur initialisé avec ${ENFORCE_DB_USER}`);
};

// Initialisation automatique
initializeUser();
