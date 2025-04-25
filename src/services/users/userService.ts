
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
  mot_de_passe: string;
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
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Accept': 'application/json'
        }
      });
      
      // Vérifier le Content-Type de la réponse pour détecter les erreurs HTML
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('text/html')) {
        console.error("Erreur: Réponse HTML reçue au lieu de JSON");
        throw new Error("Format de réponse invalide: HTML reçu au lieu de JSON");
      }
      
      if (!response.ok) {
        // Loggez plus d'infos sur la réponse pour le debug
        console.error(`Erreur HTTP: ${response.status}, StatusText: ${response.statusText}`);
        const responseText = await response.text();
        console.error("Texte de la réponse:", responseText);
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const responseText = await response.text();
      console.log("Réponse brute:", responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Erreur de parsing JSON:", e);
        console.error("Réponse non-JSON:", responseText);
        throw new Error("Format de réponse invalide: pas du JSON valide");
      }
      
      console.log("Données JSON parsées:", data);
      
      if (!data.records || !Array.isArray(data.records)) {
        console.error("Structure de données incorrecte:", data);
        throw new Error("Format de réponse invalide: records manquant ou pas un tableau");
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
