
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';

// URL de l'API
const API_URL = getApiUrl();

// User type
export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  mot_de_passe: string; // Made this required to match the interface in index.ts
  identifiant_technique: string;
  role: string;
  date_creation: string;
}

class UserService {
  private static instance: UserService;

  private constructor() {
    console.log("User service initialized with API URL:", getApiUrl());
  }

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async getUtilisateurs(): Promise<Utilisateur[]> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error("Non authentifié");
      }
      
      const currentApiUrl = getApiUrl();
      console.log(`Récupération des utilisateurs depuis: ${currentApiUrl}/check-users.php`);
      
      const response = await fetch(`${currentApiUrl}/check-users.php`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Données reçues:", data);
      
      if (!data.records || !Array.isArray(data.records)) {
        throw new Error("Format de réponse invalide");
      }
      
      return data.records;
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      throw error;
    }
  }
}

const userService = UserService.getInstance();
export const getUtilisateurs = (): Promise<Utilisateur[]> => {
  return userService.getUtilisateurs();
};
