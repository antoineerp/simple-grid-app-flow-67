
import { getCurrentUser } from './databaseConnectionService';

/**
 * Charge des données depuis le stockage local
 */
export const loadDataFromStorage = <T>(key: string): T[] => {
  try {
    const userId = getCurrentUser();
    const storageKey = `data_${userId}_${key}`;
    
    const storedData = localStorage.getItem(storageKey);
    if (!storedData) {
      return [];
    }
    
    return JSON.parse(storedData);
  } catch (error) {
    console.error(`Erreur lors du chargement des données ${key}:`, error);
    return [];
  }
};

/**
 * Sauvegarde des données dans le stockage local
 */
export const saveDataToStorage = <T>(key: string, data: T[]): boolean => {
  try {
    const userId = getCurrentUser();
    const storageKey = `data_${userId}_${key}`;
    
    localStorage.setItem(storageKey, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde des données ${key}:`, error);
    return false;
  }
};
