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
  'antcirier@gmail.com': 'p71x6d_cirier',
  'admin@example.com': 'p71x6d_richard' // Changé pour utiliser l'utilisateur richard
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
  
  // Si c'est un email mais pas dans le mapping, créer un ID technique
  if (isEmail(email)) {
    // Utiliser toujours le même utilisateur de base de données mais avec un préfixe utilisateur
    const username = email.split('@')[0];
    const technicalId = `${DEFAULT_DB_USER}_${username.toLowerCase()}`;
    console.log(`Utilisation de la base ${DEFAULT_DB_NAME} avec un préfixe utilisateur: ${technicalId}`);
    return technicalId;
  }
  
  return DEFAULT_DB_USER;
}

/**
 * Génère un ID utilisateur aléatoire sécurisé
 */
const generateSafeUserId = (): string => {
  return DEFAULT_DB_USER; // Toujours retourner l'utilisateur richard pour la sécurité
}

/**
 * Récupère l'identifiant de l'utilisateur actuellement connecté
 */
export const getCurrentUser = (): string => {
  console.log("Demande d'utilisateur actuel, forcé à utiliser la base de données:", DEFAULT_DB_NAME);
  
  // Force l'utilisation de l'utilisateur richard comme fallback
  currentUser = DEFAULT_DB_USER;
  
  // Si un ID est stocké localement mais différent du défaut, le logger mais ne pas l'utiliser
  const storedUser = localStorage.getItem('user_id');
  if (storedUser && storedUser !== DEFAULT_DB_USER) {
    console.log(`ID utilisateur local détecté: ${storedUser}, mais forcé à utiliser: ${DEFAULT_DB_USER}`);
  }
  
  // Toujours retourner l'utilisateur par défaut
  localStorage.setItem('user_id', DEFAULT_DB_USER);
  return DEFAULT_DB_USER;
};

/**
 * Alias pour getCurrentUser
 */
export const getDatabaseConnectionCurrentUser = (): string => {
  return getCurrentUser();
};

/**
 * Définit l'utilisateur actuellement connecté
 */
export const setCurrentUser = (userId: string): void => {
  // Toujours forcer l'utilisation de p71x6d_richard
  currentUser = DEFAULT_DB_USER;
  localStorage.setItem('user_id', DEFAULT_DB_USER);
  
  // Log pour le débogage
  if (userId !== DEFAULT_DB_USER) {
    console.info(`Tentative de définir l'ID utilisateur sur ${userId}, forcé à ${DEFAULT_DB_USER}`);
  }
};

/**
 * Connecte l'application à la base de données en tant qu'utilisateur spécifique
 */
export const connectAsUser = async (userId: string): Promise<boolean> => {
  // Forcer l'utilisation de p71x6d_richard
  const safeUserId = DEFAULT_DB_USER;
  
  try {
    setCurrentUser(safeUserId);
    
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/db-connection-test.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      body: JSON.stringify({ userId: safeUserId })
    });
    
    const data = await response.json();
    
    if (data.success) {
      lastConnectionError = null;
      return true;
    } else {
      lastConnectionError = data.message || "Erreur de connexion à la base de données";
      return false;
    }
  } catch (error) {
    lastConnectionError = error instanceof Error ? error.message : "Erreur inconnue";
    return false;
  }
};

/**
 * Vérifie si l'ID d'utilisateur est un utilisateur système
 */
export const isSystemUser = (userId: string): boolean => {
  return isRestrictedId(userId);
};

/**
 * Force l'utilisation d'un ID utilisateur sécurisé
 */
export const forceSafeUser = (): string => {
  const safeId = generateSafeUserId();
  setCurrentUser(safeId);
  return safeId;
};

/**
 * Récupère la dernière erreur de connexion
 */
export const getLastConnectionError = (): string | null => {
  return lastConnectionError;
};

/**
 * Déconnecte l'utilisateur de la base de données
 */
export const disconnectUser = (): void => {
  currentUser = null;
  localStorage.removeItem('user_id');
};

/**
 * Teste la connexion à la base de données
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/db-test.php`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Vérifier si la réponse est un texte vide
    const responseText = await response.text();
    if (!responseText.trim()) {
      throw new Error("Réponse vide du serveur");
    }
    
    // Détecter si la réponse est HTML au lieu de JSON
    if (responseText.trim().toLowerCase().startsWith('<!doctype') || 
        responseText.trim().toLowerCase().startsWith('<html')) {
      throw new Error("Le serveur a retourné une page HTML au lieu de JSON");
    }
    
    // Tenter de parser le JSON
    try {
      const data = JSON.parse(responseText);
      return !!data.success;
    } catch (parseError) {
      console.error("Erreur de parsing JSON:", parseError, "Contenu:", responseText.substring(0, 100));
      throw new Error("Format de réponse invalide");
    }
  } catch (error) {
    console.error("Erreur lors du test de connexion à la base de données:", error);
    return false;
  }
};

/**
 * Récupère les informations sur la base de données
 */
export const getDatabaseInfo = async (): Promise<any> => {
  try {
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/db-info.php`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Vérifier si la réponse est un texte vide
    const responseText = await response.text();
    if (!responseText.trim()) {
      throw new Error("Réponse vide du serveur");
    }
    
    // Détecter si la réponse est HTML au lieu de JSON
    if (responseText.trim().toLowerCase().startsWith('<!doctype') || 
        responseText.trim().toLowerCase().startsWith('<html')) {
      throw new Error("Le serveur a retourné une page HTML au lieu de JSON");
    }
    
    // Tenter de parser le JSON
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error("Erreur de parsing JSON:", parseError, "Contenu:", responseText.substring(0, 100));
      throw new Error("Format de réponse invalide");
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des informations de la base de données:", error);
    return { error: "Impossible de récupérer les informations" };
  }
};
