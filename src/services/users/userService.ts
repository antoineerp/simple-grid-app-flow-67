import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { fetchWithErrorHandling } from '@/config/apiConfig';
import type { Utilisateur } from '@/types/auth';

export const getUser = async (userId: string) => {
  try {
    const API_URL = getApiUrl();
    console.log(`Récupération de l'utilisateur ${userId} depuis la base de données...`);
    
    return await fetchWithErrorHandling(`${API_URL}/test?action=get_user&id=${userId}`);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return null;
  }
};

export const updateUser = async (userId: string, userData: any) => {
  try {
    const API_URL = getApiUrl();
    console.log(`Mise à jour de l'utilisateur ${userId} dans la base de données...`, userData);
    
    return await fetchWithErrorHandling(`${API_URL}/users/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
    throw error;
  }
};

export const deleteUser = async (userId: string) => {
  try {
    const API_URL = getApiUrl();
    console.log(`Suppression de l'utilisateur ${userId} de la base de données...`);
    
    return await fetchWithErrorHandling(`${API_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    throw error;
  }
};

export const getAllUsers = async (): Promise<Utilisateur[]> => {
  try {
    const API_URL = getApiUrl();
    console.log("Récupération de tous les utilisateurs directement depuis la base de données Infomaniak...");
    
    const result = await fetchWithErrorHandling(`${API_URL}/users`);
    
    if (result && result.success && result.records && Array.isArray(result.records)) {
      console.log(`${result.records.length} utilisateurs récupérés avec succès de la base de données Infomaniak`);
      return result.records;
    }
    
    console.warn("Aucun utilisateur trouvé dans la base de données:", result);
    return [];
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs depuis la base de données:", error);
    return [];
  }
};

export const userExists = async (userId: string): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    console.log(`Vérification de l'existence de l'utilisateur ${userId} dans la base de données Infomaniak...`);
    
    const result = await fetchWithErrorHandling(`${API_URL}/test?action=user_exists&userId=${userId}`);
    return result && result.success === true;
  } catch (error) {
    console.error(`Erreur lors de la vérification de l'existence de l'utilisateur ${userId}:`, error);
    return false;
  }
};

export const createUser = async (userData: {
  nom: string;
  prenom: string;
  email: string;
  mot_de_passe: string;
  role: string;
}): Promise<{ success: boolean; message?: string; user?: any }> => {
  try {
    const API_URL = getApiUrl();
    console.log(`Création d'un nouvel utilisateur dans la base de données Infomaniak...`, { ...userData, mot_de_passe: '***' });
    
    const result = await fetchWithErrorHandling(`${API_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    
    return result;
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    throw error;
  }
};

export const connectAsUser = async (identifiantTechnique: string): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    console.log(`Tentative de connexion en tant que: ${identifiantTechnique}`);
    
    const userExistsCheck = await userExists(identifiantTechnique);
    if (!userExistsCheck) {
      console.error(`L'utilisateur ${identifiantTechnique} n'existe pas dans la base de données Infomaniak`);
      return false;
    }
    
    localStorage.setItem('currentDatabaseUser', identifiantTechnique);
    
    window.dispatchEvent(new CustomEvent('database-user-changed', {
      detail: { user: identifiantTechnique }
    }));
    
    console.log(`Connexion réussie en tant que ${identifiantTechnique}`);
    return true;
  } catch (error) {
    console.error("Erreur lors de la connexion en tant qu'utilisateur:", error);
    return false;
  }
};

export const clearUsersCache = () => {
  console.log('Fonction clearUsersCache appelée - aucune action requise car nous n\'utilisons plus de cache local');
};

export const verifyAllUserTables = async (): Promise<any[]> => {
  try {
    const API_URL = getApiUrl();
    console.log(`Vérification des tables de tous les utilisateurs dans la base de données...`);
    
    const result = await fetchWithErrorHandling(`${API_URL}/test?action=verify_all_tables`);
    return result.results || [];
  } catch (error) {
    console.error("Erreur lors de la vérification des tables:", error);
    return [];
  }
};

export const userService = {
  getUser,
  updateUser,
  deleteUser,
  getAllUsers,
  createUser,
  clearUsersCache,
  connectAsUser,
  verifyAllUserTables,
  userExists
};

export default userService;
