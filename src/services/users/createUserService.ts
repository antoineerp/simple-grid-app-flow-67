
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { createUserTables } from '../core/userInitializationService';

interface CreateUserData {
  nom: string;
  prenom: string;
  email: string;
  role: string;
  mot_de_passe: string;
}

interface CreateUserResponse {
  success: boolean;
  user?: any;
  message?: string;
  error?: boolean;
}

/**
 * Crée un nouvel utilisateur
 * @param userData Les données de l'utilisateur à créer
 */
export const createUser = async (userData: CreateUserData): Promise<CreateUserResponse> => {
  try {
    const API_URL = getApiUrl();
    
    // Appel API pour créer l'utilisateur
    const response = await fetch(`${API_URL}/users.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur HTTP ${response.status}:`, errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || `Erreur ${response.status}`);
      } catch (e) {
        if (e instanceof SyntaxError) {
          throw new Error(`Erreur ${response.status}: ${errorText || 'Erreur inconnue'}`);
        }
        throw e;
      }
    }

    const data = await response.json();
    
    if (data.success && data.user) {
      console.log("Utilisateur créé avec succès:", data.user);
      
      // Créer automatiquement les tables pour l'utilisateur
      if (data.user.identifiant_technique || data.user.email) {
        const userId = data.user.identifiant_technique || data.user.email;
        try {
          const tablesCreated = await createUserTables(userId);
          if (tablesCreated) {
            console.log(`Tables créées avec succès pour l'utilisateur ${userId}`);
          } else {
            console.warn(`Problème lors de la création des tables pour l'utilisateur ${userId}`);
          }
        } catch (tableError) {
          console.error(`Erreur lors de la création des tables pour ${userId}:`, tableError);
        }
      }
      
      return {
        success: true,
        user: data.user,
        message: data.message || "Utilisateur créé avec succès"
      };
    } else {
      return {
        success: false,
        message: data.message || "Échec de la création de l'utilisateur"
      };
    }
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    return {
      success: false,
      error: true,
      message: error instanceof Error ? error.message : "Erreur inconnue"
    };
  }
};

export default createUser;
