
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { toast } from '@/components/ui/use-toast';
import { Utilisateur } from '@/types/auth';

// Variables pour stocker l'utilisateur connecté et l'état de la connexion
let currentUser: string | null = null;
let lastConnectionError: string | null = null;

// Constantes pour la validation
const RESTRICTED_IDS = ['system', 'admin', 'root', 'p71x6d_system', 'p71x6d_system2', '[object Object]', 'null', 'undefined'];
const ANONYMOUS_ID = 'anonymous';

/**
 * Vérifie si un ID est restreint/système
 */
const isRestrictedId = (id: string | null): boolean => {
  if (!id) return true;
  return RESTRICTED_IDS.includes(id) || id === 'null' || id === 'undefined';
}

/**
 * Génère un ID utilisateur aléatoire sécurisé
 */
const generateSafeUserId = (): string => {
  return 'user_' + Math.random().toString(36).substring(2, 12);
}

/**
 * Récupère l'identifiant de l'utilisateur actuellement connecté
 */
export const getCurrentUser = (): string => {
  // Si déjà mis en cache et valide, le retourner
  if (currentUser && !isRestrictedId(currentUser)) {
    return currentUser;
  }
  
  // Sinon, essayer de le récupérer du localStorage
  const storedUser = localStorage.getItem('user_id');
  
  // Vérifier que l'ID est valide et non restreint
  if (storedUser && !isRestrictedId(storedUser)) {
    currentUser = storedUser;
    return storedUser;
  }
  
  // Si l'ID est restreint, logger l'erreur
  if (storedUser && isRestrictedId(storedUser)) {
    console.error(`ID système détecté: ${storedUser}, utilisation de l'anonyme`);
  }
  
  // Valeur anonyme par défaut
  return ANONYMOUS_ID;
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
  // Vérifier si c'est un ID système dangereux
  if (isRestrictedId(userId)) {
    console.error(`Tentative de définir un ID restreint: ${userId}, utilisation d'un ID sécurisé`);
    const safeUser = generateSafeUserId();
    currentUser = safeUser;
    localStorage.setItem('user_id', safeUser);
    return;
  }
  
  currentUser = userId;
  localStorage.setItem('user_id', userId);
};

/**
 * Connecte l'application à la base de données en tant qu'utilisateur spécifique
 */
export const connectAsUser = async (userId: string): Promise<boolean> => {
  // Vérifier que l'ID n'est pas restreint
  if (isRestrictedId(userId)) {
    console.error(`Tentative de connexion avec un ID restreint: ${userId}`);
    lastConnectionError = "Identifiant utilisateur non autorisé";
    return false;
  }
  
  try {
    setCurrentUser(userId);
    
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/db-connection-test.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
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
      headers: getAuthHeaders()
    });
    
    const data = await response.json();
    return data.success;
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
      headers: getAuthHeaders()
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération des informations de la base de données:", error);
    return { error: "Impossible de récupérer les informations" };
  }
};
