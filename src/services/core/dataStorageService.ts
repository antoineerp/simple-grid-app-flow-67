
import { fetchWithErrorHandling } from '@/config/apiConfig';
import { getApiUrl } from '@/config/apiConfig';
import { getCurrentUser } from './databaseConnectionService';

/**
 * Charge des données depuis la base de données
 */
export const loadDataFromStorage = async <T>(tableName: string): Promise<T[]> => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    console.log(`Chargement des données pour ${tableName} directement depuis la base de données (utilisateur: ${userId})...`);
    
    const result = await fetchWithErrorHandling(`${API_URL}/test.php?action=get_data&tableName=${tableName}&userId=${userId}`);
    
    if (result && result.data && Array.isArray(result.data)) {
      return result.data;
    }
    
    return [];
  } catch (error) {
    console.error(`Erreur lors du chargement des données depuis la base de données:`, error);
    return [];
  }
};

/**
 * Sauvegarde des données dans la base de données
 */
export const saveDataToStorage = async <T>(tableName: string, data: T[]): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    console.log(`Sauvegarde des données pour ${tableName} directement dans la base de données (utilisateur: ${userId})...`);
    
    const result = await fetchWithErrorHandling(`${API_URL}/test.php?action=save_data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tableName,
        userId,
        data
      })
    });
    
    return result && result.success;
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde des données dans la base de données:`, error);
    return false;
  }
};

// Import avec la casse correcte et le chemin complet
export { loadData, saveData } from '../sync/syncService';
