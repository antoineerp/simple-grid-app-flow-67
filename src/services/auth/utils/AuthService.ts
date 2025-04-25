
import { AuthHeaders, LoginResponse, UserResponse } from '../types/auth.types';
import { getApiUrl } from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { disconnectUser } from '@/services/core/databaseConnectionService';
import { initializeUserData } from '@/services/core/userInitializationService';

const API_URL = getApiUrl();

export class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private currentUser: string | null = null;

  private constructor() {
    console.log("Authentication service initialized");
    this.token = localStorage.getItem('authToken');
    this.currentUser = localStorage.getItem('currentUser');
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('isLoggedIn', 'true');
    } else {
      localStorage.removeItem('authToken');
      localStorage.removeItem('isLoggedIn');
    }
  }

  public getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('authToken');
    }
    return this.token;
  }

  public getAuthHeaders(): AuthHeaders {
    const headers: AuthHeaders = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Accept': 'application/json'
    };
    
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  public async login(username: string, password: string): Promise<LoginResponse> {
    try {
      console.log(`Tentative de connexion pour l'utilisateur: ${username}`);
      
      const authUrl = `${getApiUrl()}/auth`;
      console.log(`URL de requête (authentification): ${authUrl}`);
      
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Échec de l'authentification (${response.status})`);
      }

      const data = await response.json();

      if (!data || !data.token) {
        throw new Error(data?.message || "Authentification échouée");
      }

      this.setToken(data.token);

      if (data.user) {
        const displayName = 
          (data.user.prenom && data.user.nom) 
            ? `${data.user.prenom} ${data.user.nom}` 
            : (data.user.email || data.user.identifiant_technique || 'Utilisateur');

        localStorage.setItem('currentUser', data.user.identifiant_technique);
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userName', displayName);
      }

      if (data.user && data.user.identifiant_technique) {
        await initializeUserData(data.user.identifiant_technique);
      }

      return {
        success: true,
        user: data.user
      };
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      toast({
        title: "Échec de la connexion",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
      throw error;
    }
  }

  public logout(): void {
    this.setToken(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('isLoggedIn');
    
    disconnectUser();
    
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté avec succès",
    });
  }

  public isLoggedIn(): boolean {
    return !!this.getToken();
  }

  public getCurrentUser(): string | null {
    return this.currentUser || localStorage.getItem('currentUser');
  }
}
