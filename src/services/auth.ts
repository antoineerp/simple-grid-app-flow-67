
import { apiService } from './api';
import { APP_CONFIG } from '@/lib/config';
import { ApiResponse } from '@/types/api';

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  identifiant_technique: string;
  role: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

class AuthService {
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response: ApiResponse<{ token: string; user: User }> = await apiService.login(username, password);
      
      if (response.success && response.data?.token && response.data?.user) {
        // Stocker les informations d'authentification
        localStorage.setItem(APP_CONFIG.auth.tokenKey, response.data.token);
        localStorage.setItem(APP_CONFIG.auth.userKey, JSON.stringify(response.data.user));
        localStorage.setItem(APP_CONFIG.auth.roleKey, response.data.user.role);
        
        // Configurer l'API service avec l'utilisateur actuel
        apiService.setCurrentUser(response.data.user.identifiant_technique);
        
        return {
          success: true,
          token: response.data.token,
          user: response.data.user
        };
      }
      
      throw new Error(response.message || 'Échec de la connexion');
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur de connexion'
      };
    }
  }

  logout(): void {
    localStorage.removeItem(APP_CONFIG.auth.tokenKey);
    localStorage.removeItem(APP_CONFIG.auth.userKey);
    localStorage.removeItem(APP_CONFIG.auth.roleKey);
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(APP_CONFIG.auth.userKey);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Erreur lors du parsing des données utilisateur:', e);
        return null;
      }
    }
    return null;
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(APP_CONFIG.auth.tokenKey);
    const user = this.getCurrentUser();
    return !!token && !!user;
  }

  initializeFromStorage(): void {
    const user = this.getCurrentUser();
    if (user) {
      apiService.setCurrentUser(user.identifiant_technique);
    }
  }
}

export const authService = new AuthService();

// Initialiser le service au démarrage
authService.initializeFromStorage();
