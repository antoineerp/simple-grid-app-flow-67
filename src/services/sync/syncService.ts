
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { getCurrentUser } from '../core/databaseConnectionService';

// Fonction pour synchroniser des données avec le serveur
export const syncData = async <T>(
  endpoint: string,
  data: T[],
  options: { showToast?: boolean } = {}
): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    const response = await fetch(`${API_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        data
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error(`Erreur lors de la synchronisation avec ${endpoint}:`, error);
    return false;
  }
};

// Charge des données depuis le serveur
export const loadData = async <T>(endpoint: string): Promise<T[]> => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    const response = await fetch(`${API_URL}/${endpoint}?userId=${userId}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error(`Erreur lors du chargement depuis ${endpoint}:`, error);
    return [];
  }
};

// Sauvegarde des données (localement et avec le serveur si possible)
export const saveData = async <T>(
  key: string,
  data: T[],
  options: { syncWithServer?: boolean, endpoint?: string } = {}
): Promise<boolean> => {
  try {
    // Sauvegarde locale
    localStorage.setItem(`data_${getCurrentUser()}_${key}`, JSON.stringify(data));
    
    // Synchronisation avec le serveur si demandé
    if (options.syncWithServer && options.endpoint) {
      return await syncData(options.endpoint, data);
    }
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde des données ${key}:`, error);
    return false;
  }
};
