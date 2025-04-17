
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
      const currentApiUrl = getApiUrl();
      console.log(`Tentative de connexion à l'API: ${currentApiUrl}/login`);
      
      // Ajout d'un timestamp pour éviter la mise en cache
      const cacheBuster = new Date().getTime();
      const loginUrl = `${currentApiUrl}/login?_=${cacheBuster}`;
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        body: JSON.stringify({ username, password }),
        // Désactiver la mise en cache du navigateur
        cache: 'no-cache'
      });
      
      console.log("Réponse de l'API reçue:", response.status, response.statusText);
      
      if (!response.ok) {
        // Tenter de récupérer le message d'erreur
        try {
          const error = await response.json();
          throw new Error(error.message || "Authentication error");
        } catch (parseError) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
      }
      
      // Tenter de parser la réponse JSON
      try {
        const data = await response.json();
        console.log("Connexion réussie, données reçues:", { user: data.user?.role });
        
        if (data.token && data.user) {
          // Store token and user information
          this.setToken(data.token);
          localStorage.setItem('userRole', data.user.role);
          localStorage.setItem('currentUser', data.user.identifiant_technique || username);
          localStorage.setItem('isLoggedIn', 'true');
          
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
      } catch (parseError) {
        console.error("Erreur de parsing JSON:", parseError);
        throw new Error("Réponse du serveur invalide: impossible de lire les données JSON");
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
