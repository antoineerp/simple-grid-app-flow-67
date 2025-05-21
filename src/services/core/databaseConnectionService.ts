
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { toast } from '@/components/ui/use-toast';
import { Utilisateur } from '@/types/auth';

// Variables pour stocker l'utilisateur connecté et l'état de la connexion
let currentUser: string | null = null;
let lastConnectionError: string | null = null;

// Constantes pour la validation
const RESTRICTED_IDS = ['system', 'admin', 'root', 'p71x6d_system', 'p71x6d_system2', '[object Object]', 'null', 'undefined'];
const ANONYMOUS_ID = 'p71x6d_richard'; // ID par défaut
const DEFAULT_DB_USER = 'p71x6d_richard'; // Utilisateur fixe pour la base de données
const DEFAULT_DB_NAME = 'p71x6d_richard'; // Nom de la base de données fixe

// Mapping d'emails vers des identifiants techniques
const EMAIL_TO_ID_MAPPING: Record<string, string> = {
  'antcirier@gmail.com': 'p71x6d_richard', // Associé à l'utilisateur richard pour l'administrateur
  'admin@example.com': 'p71x6d_richard'
};

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
 * Convertit un email en identifiant technique si possible
 * Toujours associer à la base de données p71x6d_richard
 */
const convertEmailToId = (email: string): string => {
  if (EMAIL_TO_ID_MAPPING[email]) {
    console.log(`Conversion de l'email ${email} vers l'identifiant technique ${EMAIL_TO_ID_MAPPING[email]}`);
    return EMAIL_TO_ID_MAPPING[email];
  }
  
  // Si c'est un email mais pas dans le mapping, associer au compte richard avec un préfixe utilisateur
  if (isEmail(email)) {
    console.log(`Association de l'email ${email} à la base ${DEFAULT_DB_NAME}`);
    return DEFAULT_DB_USER;
  }
  
  return DEFAULT_DB_USER;
}

/**
 * Récupère l'identifiant de l'utilisateur actuellement connecté
 */
export const getCurrentUser = (): string => {
  console.log("Demande d'utilisateur actuel, forcé à utiliser la base de données:", DEFAULT_DB_NAME);
  
  // Si un utilisateur est déjà défini, on le retourne
  if (currentUser && !isRestrictedId(currentUser)) {
    // Mais on force toujours l'utilisation de p71x6d_richard comme base
    return DEFAULT_DB_USER;
  }
  
  try {
    // Tentative de récupération depuis le stockage local
    const storedUser = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    
    if (storedUser && !isRestrictedId(storedUser)) {
      currentUser = convertEmailToId(storedUser); // Convertir et toujours utiliser p71x6d_richard
    } else {
      // Récupérer depuis les données utilisateur si disponible
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        try {
          const user = JSON.parse(userData) as Utilisateur;
          if (user && user.email) {
            currentUser = convertEmailToId(user.email); // Convertir et toujours utiliser p71x6d_richard
          } else {
            currentUser = DEFAULT_DB_USER;
          }
        } catch {
          currentUser = DEFAULT_DB_USER;
        }
      } else {
        // Utiliser l'ID par défaut
        currentUser = DEFAULT_DB_USER;
      }
    }
    
    // Par sécurité, forcer p71x6d_richard
    return DEFAULT_DB_USER;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'identifiant utilisateur:", error);
    return DEFAULT_DB_USER;
  }
};

/**
 * Définit l'identifiant de l'utilisateur actuellement connecté
 * Note: L'identifiant est stocké mais on continue d'utiliser p71x6d_richard comme base
 */
export const setCurrentUser = (userId: string): void => {
  if (!userId || isRestrictedId(userId)) {
    console.error("Tentative de définir un identifiant invalide:", userId);
    return;
  }
  
  try {
    // Stocker l'ID original pour référence
    localStorage.setItem('originalUserId', userId);
    
    // Mais toujours utiliser p71x6d_richard pour la base de données
    currentUser = DEFAULT_DB_USER;
    
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

// Initialiser l'utilisateur au démarrage si nécessaire
export const initializeUser = () => {
  if (!currentUser) {
    currentUser = getCurrentUser();
    console.log(`Utilisateur initialisé: ${currentUser}`);
  }
};

// Initialisation automatique
initializeUser();
