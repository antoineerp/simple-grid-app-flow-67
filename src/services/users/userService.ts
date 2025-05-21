
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { getCurrentUser } from '../core/databaseConnectionService';

// Récupérer un utilisateur par son ID
export const getUser = async (userId: string) => {
  try {
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return null;
  }
};

// Mettre à jour un utilisateur
export const updateUser = async (userId: string, userData: any) => {
  try {
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
    throw error;
  }
};

// Supprimer un utilisateur
export const deleteUser = async (userId: string) => {
  try {
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    throw error;
  }
};

// Récupérer tous les utilisateurs
export const getAllUsers = async () => {
  try {
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/users`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    return [];
  }
};

// Créer un nouvel utilisateur
export const createUser = async (userData: any) => {
  try {
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    throw error;
  }
};

// Cache management - clear users cache
let usersCache: any = null;
let usersCacheTimestamp: number = 0;

export const clearUsersCache = () => {
  usersCache = null;
  usersCacheTimestamp = 0;
  console.log('Users cache cleared');
};
