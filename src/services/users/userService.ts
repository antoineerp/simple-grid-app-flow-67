
import { getApiUrl } from '@/config/apiConfig';
import { useToast } from '@/hooks/use-toast';
import { getAuthHeaders } from '../auth/authService';

// URL de l'API
const API_URL = getApiUrl();

// User type
export interface Utilisateur {
  id: string; // Changé de number à string pour correspondre au varchar(36)
  nom: string;
  prenom: string;
  email: string;
  mot_de_passe: string; // Always stored hashed
  identifiant_technique: string;
  role: 'administrateur' | 'utilisateur' | 'gestionnaire'; // Limité aux valeurs exactes de l'enum
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
      
      // Utiliser le nouveau point d'entrée "users"
      const currentApiUrl = getApiUrl();
      console.log(`Récupération des utilisateurs depuis: ${currentApiUrl}/users`);
      
      // Essayer d'abord le endpoint principal
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
        // Si le premier essai échoue, essayer avec le endpoint de diagnostic
        return await this.getUtilisateursFromDiagnostic();
      }
      
      // Traiter la réponse du endpoint principal
      const responseText = await response.text();
      
      if (!responseText || !responseText.trim()) {
        console.error("Empty response from server");
        return await this.getUtilisateursFromDiagnostic();
      }
      
      // Vérifier si la réponse ressemble à du PHP ou HTML (erreur)
      if (responseText.includes('<?php') || responseText.includes('<br />') || responseText.includes('<!DOCTYPE')) {
        console.error("La réponse contient du PHP/HTML au lieu de JSON:", responseText.substring(0, 200));
        // Si nous avons reçu du PHP/HTML, utiliser le endpoint de diagnostic
        return await this.getUtilisateursFromDiagnostic();
      }
      
      // Essayer de parser le JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        console.error("Response text (first 500 chars):", responseText.substring(0, 500));
        return await this.getUtilisateursFromDiagnostic();
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
      console.warn("Aucun utilisateur trouvé dans la réponse:", data);
      return await this.getUtilisateursFromDiagnostic();
      
    } catch (error) {
      console.error("Error retrieving users:", error);
      // En cas d'erreur, essayer le endpoint de diagnostic
      try {
        return await this.getUtilisateursFromDiagnostic();
      } catch (fallbackError) {
        console.error("Fallback retrieval also failed:", fallbackError);
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
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error from diagnostic: ${response.status}`);
    }
    
    // Tester si la réponse est du JSON
    const text = await response.text();
    
    // Si la réponse est vide, renvoyer un tableau vide
    if (!text || !text.trim()) {
      console.error("Empty response from check-users");
      return [];
    }
    
    try {
      const data = JSON.parse(text);
      console.log("Données reçues du diagnostic:", data);
      
      if (data && data.records && Array.isArray(data.records)) {
        return data.records;
      } else if (data && Array.isArray(data)) {
        return data;
      }
      
      throw new Error("Format de données invalide du endpoint de diagnostic");
    } catch (e) {
      console.error("Erreur parsing JSON du diagnostic:", e);
      console.error("Réponse brute:", text.substring(0, 500));
      throw new Error("Format de réponse invalide du diagnostic");
    }
  }
}

// Export the user service instance
const userService = UserService.getInstance();

// Export simplified function for easier usage
export const getUtilisateurs = (): Promise<Utilisateur[]> => {
  return userService.getUtilisateurs();
};
