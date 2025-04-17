import { getApiUrl } from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { disconnectUser } from '../core/databaseConnectionService';
import { initializeUserData } from '../core/userInitializationService';

// URL de l'API
const API_URL = getApiUrl();

// Authentication service class
class AuthService {
  private static instance: AuthService;
  private token: string | null = null;

  private constructor() {
    console.log("Authentication service initialized");
    this.token = localStorage.getItem('authToken');
  }

  // Singleton pattern to get the instance
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Set the authentication token
  public setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Get the authentication token
  public getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('authToken');
    }
    return this.token;
  }

  // Get headers for authenticated API requests
  public getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Login with username and password
  public async login(username: string, password: string): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Authentication error");
      }
      
      const data = await response.json();
      
      if (data.token && data.user) {
        // Store token and user information
        this.setToken(data.token);
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('currentUser', data.user.identifiant_technique || username);
        
        // Initialize user data if needed
        const userId = data.user.identifiant_technique || username;
        await initializeUserData(userId);
        
        return {
          success: true,
          user: data.user
        };
      } else {
        throw new Error("Invalid authentication response");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown authentication error"
      };
    }
  }

  // Logout
  public logout(): void {
    this.setToken(null);
    localStorage.removeItem('userRole');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    disconnectUser();
  }
}

// Export the authentication service instance
const authService = AuthService.getInstance();

// Export simplified functions for easier usage
export const loginUser = (username: string, password: string): Promise<any> => {
  return authService.login(username, password);
};

export const logoutUser = (): void => {
  authService.logout();
};

export const getToken = (): string | null => {
  return authService.getToken();
};

export const getAuthHeaders = (): HeadersInit => {
  return authService.getAuthHeaders();
};
