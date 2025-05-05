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
      
      // Utiliser l'URL d'API actuelle
      const currentApiUrl = getApiUrl();
      console.log(`Récupération des utilisateurs depuis: ${currentApiUrl}/check-users.php`);
      
      // Modifier ici pour utiliser check-users.php à la place de /utilisateurs
      const response = await fetch(`${currentApiUrl}/check-users.php`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Error retrieving users" }));
        throw new Error(error.message || `HTTP error: ${response.status}`);
      }
      
      // Récupérer d'abord le contenu brut
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
      return [];
    } catch (error) {
      console.error("Error retrieving users:", error);
      const { toast } = useToast();
      toast({
        title: "Erreur de connexion",
        description: "Impossible de récupérer les utilisateurs depuis la base de données.",
        variant: "destructive",
      });
      
      // Fallback for development - keep only as a last resort
      console.log("Using fallback user data");
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

// Export the user service instance
const userService = UserService.getInstance();

// Export simplified function for easier usage
export const getUtilisateurs = (): Promise<Utilisateur[]> => {
  return userService.getUtilisateurs();
};
