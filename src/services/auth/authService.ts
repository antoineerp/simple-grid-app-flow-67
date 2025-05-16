
/**
 * Service d'authentification centralisé
 */

import { getApiUrl, getFullApiUrl } from '@/config/apiConfig';
import { User } from '@/types/auth';

// Types pour l'authentification
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

// Variable pour stocker l'utilisateur actuel
let currentUser: User | null = null;

/**
 * Obtient l'utilisateur actuellement connecté
 */
export const getCurrentUser = (): User | null => {
  // Si l'utilisateur est déjà défini, le retourner
  if (currentUser) {
    return currentUser;
  }
  
  // Essayer de charger l'utilisateur depuis le stockage
  try {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      currentUser = JSON.parse(userStr);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
  }
  
  return currentUser;
};

/**
 * Vérifie si l'utilisateur est connecté
 */
export const getIsLoggedIn = (): boolean => {
  return !!getAuthToken() && !!getCurrentUser();
};

/**
 * Obtient le token d'authentification
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
};

/**
 * Connexion utilisateur
 */
export const login = async (username: string, password: string): Promise<AuthResponse> => {
  try {
    console.log("Tentative de connexion à l'API:", getFullApiUrl() + "/auth.php");
    console.log("Identifiants (email):", username);
    
    // Assurer que nous appelons le bon endpoint d'authentification
    const response = await fetch(`${getFullApiUrl()}/auth.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({ 
        email: username, 
        username: username, // Envoyer les deux pour compatibilité
        password 
      }),
      credentials: 'include'
    });

    console.log("Réponse statut:", response.status);
    
    if (!response.ok) {
      const errorMessage = `Erreur HTTP: ${response.status}`;
      console.error(errorMessage);
      
      // Essayons avec l'ancien endpoint en fallback
      if (response.status === 401) {
        console.log("Tentative avec endpoint alternatif (controllers/AuthController.php)");
        const altResponse = await fetch(`${getFullApiUrl()}/controllers/AuthController.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify({ 
            email: username, 
            username: username, 
            password 
          })
        });
        
        if (altResponse.ok) {
          const altData = await altResponse.json();
          console.log("Réponse alternative:", altData);
          return processLoginResponse(altData);
        }
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Données de réponse:", data);
    
    return processLoginResponse(data);
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
};

/**
 * Traite la réponse d'authentification
 */
const processLoginResponse = (data: any): AuthResponse => {
  if (data.success && data.token) {
    // Stocker le token
    localStorage.setItem('authToken', data.token);
    sessionStorage.setItem('authToken', data.token);
    
    // Stocker les données utilisateur
    if (data.user) {
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      currentUser = data.user;
      
      // Stocker le rôle pour les vérifications de permissions
      if (data.user.role) {
        localStorage.setItem('userRole', data.user.role);
      }
    }
  }
  
  return data;
};

/**
 * Déconnexion utilisateur
 */
export const logout = async (): Promise<boolean> => {
  try {
    // Appel au serveur pour la déconnexion
    const response = await fetch(`${getApiUrl()}/logout.php`, {
      method: 'POST',
      credentials: 'include'
    });

    // Nettoyage local même si la déconnexion serveur échoue
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    currentUser = null;
    
    // Rediriger vers la page d'accueil
    window.location.href = '/';
    
    return true;
  } catch (error) {
    console.error('Erreur de déconnexion:', error);
    
    // Nettoyage local même en cas d'erreur
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    currentUser = null;
    
    return false;
  }
};

/**
 * Service d'authentification
 */
export const authService = {
  login,
  logout,
  isAuthenticated: getIsLoggedIn,
  getAuthHeaders: (): Record<string, string> => {
    const token = getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
};

// Export de la fonction getAuthHeaders pour une utilisation simple
export const getAuthHeaders = authService.getAuthHeaders;
