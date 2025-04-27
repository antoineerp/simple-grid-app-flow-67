
import { getApiUrl } from '@/config/apiConfig';
import { useToast } from '@/hooks/use-toast';
import { getAuthHeaders } from '../auth/authService';

// URL de l'API
const API_URL = getApiUrl();

// User type
export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  mot_de_passe: string; // Always stored hashed
  identifiant_technique: string;
  role: string;
  date_creation: string;
}

// User service class
class UserService {
  private static instance: UserService;
  private userDataCache: Utilisateur[] | null = null;
  private fetchPromise: Promise<Utilisateur[]> | null = null;
  private lastFetchTime: number = 0;
  private cacheDuration: number = 30000; // 30 seconds cache

  private constructor() {
    console.log("User service initialized with API URL:", getApiUrl());
  }

  // Singleton pattern to get the instance
  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  // Get users from the database with cache
  async getUtilisateurs(): Promise<Utilisateur[]> {
    // Check if we have a cached result that's still valid
    const now = Date.now();
    if (this.userDataCache && (now - this.lastFetchTime < this.cacheDuration)) {
      console.log("Returning cached user data");
      return this.userDataCache;
    }

    // Check if there's already a fetch in progress
    if (this.fetchPromise) {
      console.log("Using existing fetch promise");
      return this.fetchPromise;
    }

    console.log("Performing new fetch for user data");
    this.fetchPromise = this.fetchUtilisateurs();
    
    try {
      const users = await this.fetchPromise;
      this.userDataCache = users;
      this.lastFetchTime = Date.now();
      return users;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    } finally {
      this.fetchPromise = null; // Clear the promise regardless of outcome
    }
  }

  // Actual fetch implementation
  private async fetchUtilisateurs(): Promise<Utilisateur[]> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error("Not authenticated");
      }
      
      // Utiliser le endpoint principal
      const currentApiUrl = getApiUrl();
      console.log(`Récupération des utilisateurs depuis: ${currentApiUrl}/users`);
      
      const response = await fetch(`${currentApiUrl}/users`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        console.log(`Réponse non-OK: ${response.status} ${response.statusText}`);
        if (response.status === 500) {
          // Pour les erreurs 500, tenter d'analyser le message d'erreur du serveur
          try {
            const errorData = await response.json();
            throw new Error(errorData.message || "Erreur serveur 500");
          } catch (jsonError) {
            // Si on ne peut pas analyser la réponse JSON, utiliser un message générique
            throw new Error(`Erreur serveur (${response.status})`);
          }
        } else {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      }
      
      const responseText = await response.text();
      
      if (!responseText || !responseText.trim()) {
        console.error("Empty response from server");
        throw new Error("Réponse vide du serveur");
      }
      
      // Essayer de parser le JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        console.error("Response text (first 500 chars):", responseText.substring(0, 500));
        throw new Error("Format de réponse invalide");
      }
      
      console.log("Données utilisateurs reçues:", data);
      
      // Vérifier si nous avons des records avant de les renvoyer
      if (data && data.data && data.data.records && Array.isArray(data.data.records)) {
        return data.data.records;
      } else if (data && data.records && Array.isArray(data.records)) {
        return data.records;
      } else if (data && Array.isArray(data)) {
        return data;
      }
      
      // Pas de données valides trouvées
      console.warn("Format de données inattendu:", data);
      throw new Error("Format de données utilisateur inattendu");
      
    } catch (error) {
      console.error("Error retrieving users:", error);
      throw error; // Propager l'erreur pour une gestion uniforme
    }
  }

  // Force refresh the cache
  invalidateCache() {
    this.userDataCache = null;
    this.lastFetchTime = 0;
  }
}

// Export the user service instance
const userService = UserService.getInstance();

// Export simplified function for easier usage
export const getUtilisateurs = (): Promise<Utilisateur[]> => {
  return userService.getUtilisateurs();
};

// Export function to invalidate cache when needed
export const invalidateUserCache = (): void => {
  userService.invalidateCache();
};
