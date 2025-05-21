import { Exigence } from '@/types/exigences';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { loadDataFromStorage, saveDataToStorage } from '@/services/core/dataStorageService';
import { toast } from '@/components/ui/use-toast';
import { getUserStorageKey } from '@/services/core/userIdValidator';

// Nom du service pour le logging
const SERVICE_NAME = 'exigencesService';

/**
 * Charge les exigences depuis le serveur et met à jour le stockage local
 */
export const loadExigencesFromServer = async (forceRefresh: boolean = false): Promise<Exigence[]> => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    const response = await fetch(`${API_URL}/exigences-load.php?userId=${userId}`, {
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
    const exigences = data.exigences || [];
    
    // Mise à jour du stockage local
    saveExigencesToStorage(exigences);
    
    return exigences;
  } catch (error) {
    console.error(`${SERVICE_NAME}: Erreur lors du chargement depuis le serveur:`, error);
    if (!forceRefresh) {
      // En cas d'erreur, essayer de charger depuis le stockage local
      return loadExigencesFromStorage();
    }
    return [];
  }
};

/**
 * Synchronise les exigences avec le serveur
 */
export const syncExigencesWithServer = async (exigences: Exigence[]): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    const response = await fetch(`${API_URL}/exigences-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        exigences
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      // Mise à jour du stockage local après une synchronisation réussie
      saveExigencesToStorage(exigences);
      toast({
        title: "Synchronisation réussie",
        description: "Les exigences ont été synchronisées avec succès.",
      });
    }
    
    return result.success;
  } catch (error) {
    console.error(`${SERVICE_NAME}: Erreur lors de la synchronisation:`, error);
    toast({
      variant: "destructive",
      title: "Erreur de synchronisation",
      description: "Impossible de synchroniser les exigences avec le serveur.",
    });
    return false;
  }
};

/**
 * Charge les exigences depuis le stockage local
 */
export const loadExigencesFromStorage = (): Exigence[] => {
  const storageKey = getUserStorageKey('exigences');
  
  try {
    const storedData = localStorage.getItem(storageKey);
    if (!storedData) {
      return [];
    }
    
    const parsedData = JSON.parse(storedData);
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    console.error(`${SERVICE_NAME}: Erreur lors du chargement des données locales:`, error);
    return [];
  }
};

/**
 * Sauvegarde les exigences dans le stockage local
 */
export const saveExigencesToStorage = (exigences: Exigence[]): void => {
  const storageKey = getUserStorageKey('exigences');
  
  try {
    localStorage.setItem(storageKey, JSON.stringify(exigences));
  } catch (error) {
    console.error(`${SERVICE_NAME}: Erreur lors de la sauvegarde des données locales:`, error);
    toast({
      variant: "destructive",
      title: "Erreur de stockage",
      description: "Impossible de sauvegarder les données localement. Vérifiez l'espace disponible."
    });
  }
};
