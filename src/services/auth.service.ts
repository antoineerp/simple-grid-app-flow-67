
// Service d'authentification unifié
import { apiClient } from '@/lib/api';
import { APP_CONFIG } from '@/lib/config';
import { User, AuthState } from '@/types';

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth', credentials);
      
      if (response.success && response.data?.token && response.data?.user) {
        this.setAuthData(response.data.token, response.data.user);
        return response.data;
      }
      
      throw new Error(response.message || 'Échec de la connexion');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem(APP_CONFIG.auth.tokenKey);
    localStorage.removeItem(APP_CONFIG.auth.userKey);
    localStorage.removeItem(APP_CONFIG.auth.roleKey);
    localStorage.removeItem('currentDatabaseUser');
  }

  private setAuthData(token: string, user: User): void {
    localStorage.setItem(APP_CONFIG.auth.tokenKey, token);
    localStorage.setItem(APP_CONFIG.auth.userKey, JSON.stringify(user));
    localStorage.setItem(APP_CONFIG.auth.roleKey, user.role);
    localStorage.setItem('currentDatabaseUser', user.identifiant_technique);
  }

  getAuthState(): AuthState {
    const token = localStorage.getItem(APP_CONFIG.auth.tokenKey);
    const userStr = localStorage.getItem(APP_CONFIG.auth.userKey);
    
    let user: User | null = null;
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    return {
      isAuthenticated: !!token && !!user,
      user,
      token
    };
  }

  getCurrentUser(): User | null {
    return this.getAuthState().user;
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }
}

export const authService = new AuthService();
