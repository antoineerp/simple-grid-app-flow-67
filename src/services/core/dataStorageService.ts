
import { getCurrentUser } from './databaseConnectionService';

/**
 * Charge des données depuis le stockage local
 */
export const loadDataFromStorage = <T>(key: string): T[] => {
  const storageKey = `data_${getCurrentUser()}_${key}`;
  
  try {
    const storedData = localStorage.getItem(storageKey);
    if (!storedData) {
      return [];
    }
    
    const parsedData = JSON.parse(storedData);
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    console.error(`Erreur lors du chargement des données locales:`, error);
    return [];
  }
};

/**
 * Sauvegarde des données dans le stockage local
 */
export const saveDataToStorage = <T>(key: string, data: T[]): void => {
  const storageKey = `data_${getCurrentUser()}_${key}`;
  
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde des données locales:`, error);
    // Optionally add toast notification here
  }
};

// Import with consistent casing
export { loadData, saveData } from '@/services/sync/syncService';
