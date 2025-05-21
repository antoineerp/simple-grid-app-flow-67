
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { toast } from '@/components/ui/use-toast';
import { Utilisateur } from '@/types/auth';

// Variables pour stocker l'utilisateur connecté et l'état de la connexion
let currentUser: string | null = null;
let lastConnectionError: string | null = null;

/**
 * Récupère l'identifiant de l'utilisateur actuellement connecté
 */
export const getCurrentUser = (): string => {
  // Si déjà mis en cache, le retourner
  if (currentUser) {
    return currentUser;
  }
  
  // Sinon, essayer de le récupérer du localStorage
  const storedUser = localStorage.getItem('user_id');
  if (storedUser) {
    // Vérifier si c'est un ID système
    if (isSystemUser(storedUser)) {
      console.log("ID système détecté dans le token, vérification nécessaire");
      const safeUser = forceSafeUser();
      console.log("Tentative de définir l'ID système problématique");
      return safeUser;
    }
    currentUser = storedUser;
    return storedUser;
  }
  
  // Valeur par défaut sécurisée
  return forceSafeUser();
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
  if (isSystemUser(userId)) {
    console.log("ID système problématique détecté", userId);
    const safeUser = forceSafeUser();
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
  // Liste des ID système sensibles
  const systemIds = ['system', 'admin', 'root', '[object Object]', 'null', 'undefined'];
  return systemIds.includes(userId) || !userId || userId === 'null' || userId === 'undefined';
};

/**
 * Force l'utilisation d'un ID utilisateur sécurisé
 */
export const forceSafeUser = (): string => {
  const safeId = 'user_' + Math.random().toString(36).substr(2, 9);
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
