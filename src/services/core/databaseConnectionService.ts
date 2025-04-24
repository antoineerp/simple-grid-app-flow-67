
import { getAuthHeaders } from '../auth/authService';
import { Utilisateur } from '../index';

// Use import.meta.env instead of process.env for Vite compatibility
const API_BASE_URL = import.meta.env.VITE_API_ENDPOINT || '/api';

// Fonction pour se connecter en tant qu'utilisateur
export const connectAsUser = async (identifiant: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/connect-as-user`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ identifiant }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erreur lors de la connexion en tant qu'utilisateur: ${response.status}`);
    }

    const result = await response.json();
    if (result.success) {
      localStorage.setItem('dbCurrentUser', identifiant);
      localStorage.removeItem('dbLastError');
      return true;
    } else {
      localStorage.setItem('dbLastError', result.message || 'Erreur inconnue');
      return false;
    }
  } catch (error: any) {
    localStorage.setItem('dbLastError', error.message || 'Erreur inconnue');
    console.error("Erreur lors de la connexion en tant qu'utilisateur:", error);
    return false;
  }
};

// Fonction pour récupérer la dernière erreur de connexion
export const getLastConnectionError = (): string | null => {
  return localStorage.getItem('dbLastError') || null;
};

// Fonction pour déconnecter l'utilisateur
export const disconnectUser = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/disconnect-user`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erreur lors de la déconnexion de l'utilisateur: ${response.status}`);
    }

    const result = await response.json();
    if (result.success) {
      localStorage.removeItem('dbCurrentUser');
      return true;
    } else {
      console.error("Erreur lors de la déconnexion de l'utilisateur:", result.message);
      return false;
    }
  } catch (error) {
    console.error("Erreur lors de la déconnexion de l'utilisateur:", error);
    return false;
  }
};

// Fonction pour tester la connexion à la base de données
export const testDatabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/test-db-connection`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, message: data.message || "Connexion à la base de données réussie" };
    } else {
      return { success: false, message: data.message || "Erreur lors de la connexion à la base de données" };
    }
  } catch (error: any) {
    console.error("Erreur lors du test de la connexion à la base de données:", error);
    return { success: false, message: error.message || "Erreur inconnue lors du test de la connexion" };
  }
};

// Fonction pour obtenir les informations de la base de données
export const getDatabaseInfo = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/database-info`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des informations de la base de données: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la récupération des informations de la base de données:", error);
    throw error;
  }
};

// Ajout de l'export manquant getCurrentUser qui était précédemment accessible via dbConnectionService.getCurrentUser()
export const getCurrentUser = (): string | null => {
  // Implementation basée sur votre code existant
  return localStorage.getItem('dbCurrentUser') || null;
};
