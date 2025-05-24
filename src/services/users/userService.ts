
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { fetchWithErrorHandling } from '@/config/apiConfig';
import type { Utilisateur } from '@/types/auth';

// Récupérer un utilisateur par son ID
export const getUser = async (userId: string) => {
  try {
    const API_URL = getApiUrl();
    console.log(`Récupération de l'utilisateur ${userId} depuis la base de données...`);
    
    return await fetchWithErrorHandling(`${API_URL}/test.php?action=get_user&id=${userId}`);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return null;
  }
};

// Mettre à jour un utilisateur
export const updateUser = async (userId: string, userData: any) => {
  try {
    const API_URL = getApiUrl();
    console.log(`Mise à jour de l'utilisateur ${userId} dans la base de données...`, userData);
    
    return await fetchWithErrorHandling(`${API_URL}/test.php?action=update_user&id=${userId}`, {
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
    console.log(`Suppression de l'utilisateur ${userId} de la base de données...`);
    
    return await fetchWithErrorHandling(`${API_URL}/test.php?action=delete_user&id=${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    throw error;
  }
};

// Récupérer tous les utilisateurs directement depuis la base de données
export const getAllUsers = async (): Promise<Utilisateur[]> => {
  try {
    const API_URL = getApiUrl();
    console.log("Récupération de tous les utilisateurs directement de la base de données...");
    
    // Essayer d'abord avec check-users.php
    try {
      const result = await fetchWithErrorHandling(`${API_URL}/check-users.php`);
      
      if (result && result.records && Array.isArray(result.records)) {
        console.log(`${result.records.length} utilisateurs récupérés avec succès de la base de données via check-users.php`);
        return result.records;
      }
    } catch (checkError) {
      console.error("Erreur avec check-users.php:", checkError);
    }
    
    // Essayer ensuite avec test.php
    const result = await fetchWithErrorHandling(`${API_URL}/test.php?action=users`);
    
    if (result && result.records && Array.isArray(result.records)) {
      console.log(`${result.records.length} utilisateurs récupérés avec succès de la base de données via test.php`);
      return result.records;
    }
    
    console.warn("Format de réponse inattendu:", result);
    return [];
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    return [];
  }
};

// Vérifier si un utilisateur existe
export const userExists = async (userId: string): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    console.log(`Vérification de l'existence de l'utilisateur ${userId} dans la base de données...`);
    
    const result = await fetchWithErrorHandling(`${API_URL}/test.php?action=user_exists&userId=${userId}`);
    return result && result.success === true;
  } catch (error) {
    console.error(`Erreur lors de la vérification de l'existence de l'utilisateur ${userId}:`, error);
    return false;
  }
};

// Créer un nouvel utilisateur
export const createUser = async (userData: any) => {
  try {
    const API_URL = getApiUrl();
    console.log(`Création d'un nouvel utilisateur dans la base de données...`, userData);
    
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
    console.log(`Vérification des tables de tous les utilisateurs dans la base de données...`);
    
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
    
    // Vérifier si l'utilisateur existe
    const userExistsCheck = await userExists(identifiantTechnique);
    if (!userExistsCheck) {
      console.error(`L'utilisateur ${identifiantTechnique} n'existe pas dans la base de données`);
      return false;
    }
    
    const result = await fetchWithErrorHandling(`${API_URL}/test.php?action=connect_as_user`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ identifiant_technique: identifiantTechnique })
    });
    
    if (result && result.success) {
      // Stocker uniquement l'identifiant de l'utilisateur actuel pour référence
      // mais pas les données elles-mêmes
      localStorage.setItem('currentDatabaseUser', identifiantTechnique);
      
      // Déclencher un événement pour notifier les composants
      window.dispatchEvent(new CustomEvent('database-user-changed', {
        detail: { user: identifiantTechnique }
      }));
      
      console.log(`Connexion réussie en tant que ${identifiantTechnique}`);
      return true;
    }
    
    console.error(`Échec de la connexion en tant que ${identifiantTechnique}:`, result);
    return false;
  } catch (error) {
    console.error("Erreur lors de la connexion en tant qu'utilisateur:", error);
    return false;
  }
};

// Fonction pour vider le cache
export const clearUsersCache = () => {
  console.log('Fonction clearUsersCache appelée - aucune action requise car nous n\'utilisons plus de cache local');
  // Cette fonction est conservée pour la compatibilité API
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
  verifyAllUserTables,
  userExists
};

export default userService;
