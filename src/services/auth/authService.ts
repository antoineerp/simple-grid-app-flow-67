
/**
 * Service d'authentification centralisé
 */

import { getApiUrl } from '@/config/apiConfig';

// Types pour l'authentification
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: any;
  message?: string;
}

/**
 * Service d'authentification
 */
export const authService = {
  /**
   * Authentifie un utilisateur
   * @param credentials Identifiants
   * @returns Réponse d'authentification
   */
  login: async (credentials: AuthCredentials): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${getApiUrl()}/auth.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  },

  /**
   * Déconnecte l'utilisateur
   */
  logout: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${getApiUrl()}/logout.php`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      // Supprimer le token du localStorage
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');

      return true;
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      return false;
    }
  },

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return !!token;
  },

  /**
   * Obtient les en-têtes d'authentification
   */
  getAuthHeaders: (): Record<string, string> => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
};

// Export de la fonction getAuthHeaders pour une utilisation simple
export const getAuthHeaders = authService.getAuthHeaders;
