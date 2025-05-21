
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { Utilisateur } from '@/types/auth';

// Variable to store the users cache
let usersCache: Utilisateur[] | null = null;

/**
 * Clears the users cache
 */
export const clearUsersCache = (): void => {
  usersCache = null;
};

/**
 * Get a user by ID
 */
export const getUser = async (userId: string): Promise<Utilisateur | null> => {
  try {
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/users?id=${userId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};

/**
 * Update a user
 */
export const updateUser = async (user: Utilisateur): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/users`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(user)
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      clearUsersCache(); // Clear cache on successful update
    }
    
    return result.success;
  } catch (error) {
    console.error("Error updating user:", error);
    return false;
  }
};

/**
 * Delete a user
 */
export const deleteUser = async (userId: string | number): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/users`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: userId })
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      clearUsersCache(); // Clear cache on successful deletion
    }
    
    return result.success;
  } catch (error) {
    console.error("Error deleting user:", error);
    return false;
  }
};

/**
 * Get all users
 */
export const getAllUsers = async (forceRefresh: boolean = false): Promise<Utilisateur[]> => {
  if (!forceRefresh && usersCache !== null) {
    return usersCache;
  }
  
  try {
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/users`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    usersCache = data.users || [];
    return usersCache;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

/**
 * Create a new user
 */
export const createUser = async (user: Partial<Utilisateur>): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(user)
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      clearUsersCache(); // Clear cache on successful creation
    }
    
    return result.success;
  } catch (error) {
    console.error("Error creating user:", error);
    return false;
  }
};
