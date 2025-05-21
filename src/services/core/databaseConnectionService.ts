import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { toast } from '@/components/ui/use-toast';
import { Utilisateur } from '@/types/auth';

// Variables pour stocker l'utilisateur connecté et l'état de la connexion
let currentUser: string | null = null;
let lastConnectionError: string | null = null;

// Constantes pour la validation
const RESTRICTED_IDS = ['system', 'admin', 'root', 'p71x6d_system', 'p71x6d_system2', '[object Object]', 'null', 'undefined'];
const DEFAULT_DB_USER = 'p71x6d_richard'; // Utilisateur fixe pour la base de données
const DEFAULT_DB_NAME = 'p71x6d_richard'; // Nom de la base de données fixe

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
  // Vérifier si c'est l'administrateur antcirier@gmail.com
  const storedEmail = localStorage.getItem('userEmail');
  if (storedEmail === 'antcirier@gmail.com') {
    console.log("Email administrateur détecté: antcirier@gmail.com - Utilisation de p71x6d_richard");
    return DEFAULT_DB_USER;
  }
  
  console.log("Demande d'utilisateur actuel, forcé à utiliser la base de données:", DEFAULT_DB_NAME);
  
  // TOUJOURS utiliser p71x6d_richard
  return DEFAULT_DB_USER;
};

/**
 * Définit l'identifiant de l'utilisateur actuellement connecté
 * Note: L'identifiant est stocké mais on continue d'utiliser p71x6d_richard comme base
 */
export const setCurrentUser = (userId: string): void => {
  // Vérifier si c'est l'administrateur antcirier@gmail.com
  const storedEmail = localStorage.getItem('userEmail');
  if (storedEmail === 'antcirier@gmail.com') {
    console.log("Email administrateur détecté lors de setCurrentUser - Utilisation de p71x6d_richard");
    currentUser = DEFAULT_DB_USER;
    localStorage.setItem('userId', DEFAULT_DB_USER);
    localStorage.setItem('user_id', DEFAULT_DB_USER);
    return;
  }
  
  if (!userId || isRestrictedId(userId)) {
    console.error("Tentative de définir un identifiant invalide:", userId);
    userId = DEFAULT_DB_USER;
  }
  
  try {
    // Stocker l'ID original pour référence
    localStorage.setItem('originalUserId', userId);
    
    // Mais toujours utiliser p71x6d_richard pour la base de données
    currentUser = DEFAULT_DB_USER;
    
    // Stocker l'ID utilisateur sécurisé
    localStorage.setItem('userId', DEFAULT_DB_USER);
    localStorage.setItem('user_id', DEFAULT_DB_USER);
    
    // Stocker également le préfixe utilisateur pour distinguer les données
    const userPrefix = userId.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 10);
    localStorage.setItem('userPrefix', userPrefix);
    
    console.log(`Identifiant utilisateur défini: ${userId} (base: ${DEFAULT_DB_NAME}, préfixe: ${userPrefix})`);
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
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    
    if (data.connection && data.connection.is_connected) {
      console.log("Connexion à la base de données réussie:", data.config);
      return { success: true, message: "Connecté à la base de données" };
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
 * Toujours utilise p71x6d_richard
 */
export const connectAsUser = async (userId: string): Promise<boolean> => {
  try {
    // Toujours utiliser p71x6d_richard comme base, mais stocker l'ID original
    setCurrentUser(userId);
    
    toast({
      title: "Connexion réussie",
      description: `Connecté à la base de données en tant que ${DEFAULT_DB_NAME}`,
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
    currentUser = DEFAULT_DB_USER;
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
  return DEFAULT_DB_USER;
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

// Initialiser l'utilisateur au démarrage si nécessaire
export const initializeUser = () => {
  // Vérifier si c'est l'administrateur antcirier@gmail.com
  const storedEmail = localStorage.getItem('userEmail');
  if (storedEmail === 'antcirier@gmail.com') {
    console.log("Email administrateur détecté lors de l'initialisation - Utilisation de p71x6d_richard");
    currentUser = DEFAULT_DB_USER;
    localStorage.setItem('userId', DEFAULT_DB_USER);
    localStorage.setItem('user_id', DEFAULT_DB_USER);
    console.log(`Utilisateur administrateur initialisé avec ${DEFAULT_DB_USER}`);
    return;
  }
  
  // Pour tous les autres utilisateurs, utiliser également p71x6d_richard
  if (!currentUser) {
    currentUser = DEFAULT_DB_USER;
    console.log(`Utilisateur standard initialisé avec ${DEFAULT_DB_USER}`);
  }
};

// Initialisation automatique
initializeUser();
