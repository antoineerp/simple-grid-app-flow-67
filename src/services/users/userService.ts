
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { fetchWithErrorHandling } from '@/config/apiConfig';
import type { Utilisateur } from '@/types/auth';

// Récupérer un utilisateur par son ID
export const getUser = async (userId: string) => {
  try {
    const API_URL = getApiUrl();
    return await fetchWithErrorHandling(`${API_URL}/users/${userId}`);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return null;
  }
};

// Mettre à jour un utilisateur
export const updateUser = async (userId: string, userData: any) => {
  try {
    const API_URL = getApiUrl();
    
    return await fetchWithErrorHandling(`${API_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders()
      },
      body: JSON.stringify(userData)
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
    throw error;
  }
};

// Supprimer un utilisateur
export const deleteUser = async (userId: string) => {
  try {
    const API_URL = getApiUrl();
    
    return await fetchWithErrorHandling(`${API_URL}/test.php?action=delete_user&id=${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    throw error;
  }
};

// Récupérer tous les utilisateurs avec une méthode plus directe
export const getAllUsers = async (): Promise<Utilisateur[]> => {
  try {
    const API_URL = getApiUrl();
    console.log("Récupération de tous les utilisateurs...");
    
    // Appeler directement le script test.php avec l'action=users qui fonctionne
    const result = await fetchWithErrorHandling(`${API_URL}/test.php?action=users`);
    
    if (result && result.records && Array.isArray(result.records)) {
      console.log(`${result.records.length} utilisateurs récupérés avec succès`);
      return result.records;
    }
    
    console.warn("Format de réponse inattendu:", result);
    return [];
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    return [];
  }
};

// Créer un nouvel utilisateur
export const createUser = async (userData: any) => {
  try {
    const API_URL = getApiUrl();
    
    return await fetchWithErrorHandling(`${API_URL}/test.php?action=create_user`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    throw error;
  }
};

// Vérifier les tables de tous les utilisateurs
export const verifyAllUserTables = async (): Promise<any[]> => {
  try {
    const API_URL = getApiUrl();
    
    const result = await fetchWithErrorHandling(`${API_URL}/test.php?action=verify_all_tables`);
    return result.results || [];
  } catch (error) {
    console.error("Erreur lors de la vérification des tables:", error);
    return [];
  }
};

// Se connecter en tant qu'utilisateur spécifique
export const connectAsUser = async (identifiantTechnique: string): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    console.log(`Tentative de connexion en tant que: ${identifiantTechnique}`);
    
    const result = await fetchWithErrorHandling(`${API_URL}/test.php?action=connect_as_user`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ identifiant_technique: identifiantTechnique })
    });
    
    if (result && result.success) {
      // Mettre à jour l'utilisateur dans le localStorage
      localStorage.setItem('currentDatabaseUser', identifiantTechnique);
      
      // Déclencher un événement pour notifier les composants
      window.dispatchEvent(new CustomEvent('database-user-changed', {
        detail: { user: identifiantTechnique }
      }));
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Erreur lors de la connexion en tant qu'utilisateur:", error);
    return false;
  }
};

// Cache management - clear users cache
let usersCache: any = null;
let usersCacheTimestamp: number = 0;

export const clearUsersCache = () => {
  usersCache = null;
  usersCacheTimestamp = 0;
  console.log('Cache des utilisateurs effacé');
};

// Export le service utilisateur complet
export const userService = {
  getUser,
  updateUser,
  deleteUser,
  getAllUsers,
  createUser,
  clearUsersCache,
  connectAsUser,
  verifyAllUserTables
};

export default userService;
