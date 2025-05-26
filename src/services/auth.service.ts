
import { APP_CONFIG } from '@/lib/config';
import { ApiResponse, User, AuthState } from '@/types';

class AuthService {
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

  async login(credentials: { username: string; password: string }): Promise<void> {
    const response = await fetch(`${APP_CONFIG.api.baseUrl}/auth.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data: ApiResponse<{ token: string; user: User }> = await response.json();
    
    if (!data.success || !data.data?.token || !data.data?.user) {
      throw new Error(data.message || 'Login failed');
    }

    localStorage.setItem(APP_CONFIG.auth.tokenKey, data.data.token);
    localStorage.setItem(APP_CONFIG.auth.userKey, JSON.stringify(data.data.user));
    localStorage.setItem(APP_CONFIG.auth.roleKey, data.data.user.role);
  }

  logout(): void {
    localStorage.removeItem(APP_CONFIG.auth.tokenKey);
    localStorage.removeItem(APP_CONFIG.auth.userKey);
    localStorage.removeItem(APP_CONFIG.auth.roleKey);
  }

  isAdmin(): boolean {
    const userStr = localStorage.getItem(APP_CONFIG.auth.userKey);
    if (!userStr) return false;
    
    try {
      const user = JSON.parse(userStr);
      return user.role === 'admin';
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();
