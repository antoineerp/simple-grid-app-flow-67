
/**
 * Service de connexion à la base de données
 * Ce service gère la connexion à la base de données et les utilisateurs
 */

import { safeLocalStorageGet, safeLocalStorageSet } from '@/utils/syncStorageCleaner';

// Clé pour stocker l'utilisateur actuel dans le localStorage
const CURRENT_USER_KEY = 'current_database_user';

// Fonction pour obtenir l'utilisateur actuel
export const getCurrentUser = (): string | null => {
  try {
    return safeLocalStorageGet<string>(CURRENT_USER_KEY, null);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur actuel:', error);
    return null;
  }
};

// Fonction pour définir l'utilisateur actuel
export const setCurrentUser = (userId: string): boolean => {
  try {
    safeLocalStorageSet(CURRENT_USER_KEY, userId);
    console.log(`Utilisateur défini: ${userId}`);
    
    // Déclencher un événement pour informer l'application du changement d'utilisateur
    window.dispatchEvent(new CustomEvent('user-changed', {
      detail: { userId }
    }));
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la définition de l\'utilisateur actuel:', error);
    return false;
  }
};

// Fonction pour obtenir l'utilisateur connecté pour la connexion à la base de données
export const getDatabaseConnectionCurrentUser = (): string | null => {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    console.warn('Aucun utilisateur défini, utilisation du compte système par défaut');
    return 'p71x6d_system';
  }
  
  return currentUser;
};

// Base URL pour l'API
export const getApiBaseUrl = (): string => {
  // On peut éventuellement adapter l'URL en fonction de l'environnement
  return 'https://api.infomaniak-system.net';
};

// Fonction pour obtenir l'URL complète de l'API pour un utilisateur spécifique
export const getUserApiUrl = (endpoint: string, userId?: string): string => {
  const baseUrl = getApiBaseUrl();
  const user = userId || getDatabaseConnectionCurrentUser() || 'p71x6d_system';
  
  // Construit l'URL avec l'utilisateur intégré
  return `${baseUrl}/users/${user}/${endpoint}`;
};

// Fonction pour obtenir les en-têtes d'authentification pour une requête API
export const getApiAuthHeaders = (userId?: string): Record<string, string> => {
  const user = userId || getDatabaseConnectionCurrentUser() || 'p71x6d_system';
  
  // Simule un token d'authentification basé sur l'ID utilisateur
  // Dans une application réelle, vous utiliseriez un véritable système d'authentification
  const dummyToken = btoa(`user-${user}-${Date.now()}`);
  
  return {
    'Authorization': `Bearer ${dummyToken}`,
    'X-User-ID': user
  };
};

// Fonction pour initialiser la connexion à la base de données
export const initializeDatabaseConnection = (userId: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    try {
      // Définir l'utilisateur actuel
      setCurrentUser(userId);
      
      // Simuler une initialisation de connexion
      setTimeout(() => {
        console.log(`Connexion à la base de données initialisée pour l'utilisateur ${userId}`);
        
        // Déclencher un événement pour informer l'application
        window.dispatchEvent(new CustomEvent('database-initialized', {
          detail: { userId, success: true }
        }));
        
        resolve(true);
      }, 500);
    } catch (error) {
      console.error(`Erreur lors de l'initialisation de la connexion pour ${userId}:`, error);
      reject(error);
    }
  });
};
