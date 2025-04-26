
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

  // Get users from the database
  async getUtilisateurs(): Promise<Utilisateur[]> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error("Not authenticated");
      }
      
      // Utiliser le point d'entrée spécifique aux utilisateurs
      const currentApiUrl = getApiUrl();
      console.log(`Récupération des utilisateurs depuis: ${currentApiUrl}/utilisateurs`);
      
      // Essayer d'abord le endpoint principal
      const response = await fetch(`${currentApiUrl}/utilisateurs`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        // Si le premier essai échoue, essayer avec le endpoint de diagnostic
        console.log("Premier essai échoué, tentative avec /api/check-users");
        const fallbackResponse = await fetch(`${currentApiUrl}/check-users`, {
          method: 'GET',
          headers: {
            ...getAuthHeaders(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!fallbackResponse.ok) {
          throw new Error(`HTTP error: ${fallbackResponse.status}`);
        }
        
        const fallbackData = await fallbackResponse.json();
        console.log("Données reçues du endpoint de diagnostic:", fallbackData);
        
        if (fallbackData && fallbackData.records && Array.isArray(fallbackData.records)) {
          return fallbackData.records;
        } else if (fallbackData && Array.isArray(fallbackData)) {
          return fallbackData;
        }
        
        throw new Error("Format de données invalide");
      }
      
      // Traiter la réponse du endpoint principal
      const responseText = await response.text();
      
      if (!responseText.trim()) {
        throw new Error("Empty response from server");
      }
      
      // Essayer de parser le JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        throw new Error("Invalid JSON response");
      }
      
      console.log("Données utilisateurs reçues:", data);
      
      // Vérifier si nous avons des records avant de les renvoyer
      if (data && data.records && Array.isArray(data.records)) {
        return data.records;
      } else if (data && Array.isArray(data)) {
        return data;
      }
      
      // Pas de données valides trouvées
      console.warn("Aucun utilisateur trouvé dans la réponse:", data);
      
      // Faire une dernière tentative avec le endpoint de diagnostic direct
      console.log("Tentative avec /api/check-users");
      return await this.getUtilisateursFromDiagnostic();
    } catch (error) {
      console.error("Error retrieving users:", error);
      // En cas d'erreur, essayer le endpoint de diagnostic
      try {
        return await this.getUtilisateursFromDiagnostic();
      } catch (fallbackError) {
        const { toast } = useToast();
        toast({
          title: "Erreur de connexion",
          description: "Impossible de récupérer les utilisateurs depuis la base de données.",
          variant: "destructive",
        });
        
        // Fallback pour le développement - garder uniquement en dernier recours
        return [
          {
            id: 1,
            nom: "Cirier",
            prenom: "Antoine",
            email: "antcirier@gmail.com",
            mot_de_passe: "****",
            identifiant_technique: "p71x6d_system",
            role: "admin",
            date_creation: "2025-03-31 16:10:09"
          }
        ];
      }
    }
  }
  
  // Méthode de secours pour récupérer les utilisateurs via le endpoint de diagnostic
  private async getUtilisateursFromDiagnostic(): Promise<Utilisateur[]> {
    const currentApiUrl = getApiUrl();
    console.log(`Récupération des utilisateurs depuis le diagnostic: ${currentApiUrl}/check-users`);
    
    const response = await fetch(`${currentApiUrl}/check-users`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error from diagnostic: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Données reçues du diagnostic:", data);
    
    if (data && data.records && Array.isArray(data.records)) {
      return data.records;
    } else if (data && Array.isArray(data)) {
      return data;
    }
    
    throw new Error("Format de données invalide du endpoint de diagnostic");
  }
}

// Export the user service instance
const userService = UserService.getInstance();

// Export simplified function for easier usage
export const getUtilisateurs = (): Promise<Utilisateur[]> => {
  return userService.getUtilisateurs();
};
