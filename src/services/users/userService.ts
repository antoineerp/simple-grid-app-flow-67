import { getApiUrl } from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
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
    console.log("User service initialized");
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
      
      const response = await fetch(`${API_URL}/utilisateurs`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error retrieving users");
      }
      
      const data = await response.json();
      return data.records || [];
    } catch (error) {
      console.error("Error retrieving users:", error);
      toast({
        title: "Connection error",
        description: "Unable to retrieve users from the database.",
        variant: "destructive",
      });
      
      // Fallback for development
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
        },
        {
          id: 2,
          nom: "Dupont",
          prenom: "Jean",
          email: "jean.dupont@example.com",
          mot_de_passe: "****",
          identifiant_technique: "p71x6d_dupont",
          role: "utilisateur",
          date_creation: "2025-04-01 10:15:00"
        },
        {
          id: 3,
          nom: "Martin",
          prenom: "Sophie",
          email: "sophie.martin@example.com",
          mot_de_passe: "****",
          identifiant_technique: "p71x6d_martin",
          role: "gestionnaire",
          date_creation: "2025-04-02 14:30:00"
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
