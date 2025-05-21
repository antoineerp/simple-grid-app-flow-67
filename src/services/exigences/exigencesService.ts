
import { Exigence } from '@/types/exigences';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { toast } from '@/components/ui/use-toast';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { loadData, saveData } from '@/services/core/dataStorageService';
import { getUserStorageKey } from '@/services/core/userIdValidator';

// Nom du service pour le logging
const SERVICE_NAME = 'exigencesService';

/**
 * Charge les exigences depuis le serveur et met à jour le stockage local
 */
export const loadExigencesFromServer = async (forceRefresh: boolean = false): Promise<Exigence[]> => {
  return loadData<Exigence>('exigences-load.php', 'exigences', {
    forceRefresh,
    showToasts: true,
    serviceName: SERVICE_NAME
  });
};

/**
 * Synchronise les exigences avec le serveur
 */
export const syncExigencesWithServer = async (exigences: Exigence[]): Promise<boolean> => {
  return saveData<Exigence>('exigences-sync.php', 'exigences', exigences, {
    syncWithServer: true,
    showToasts: true,
    serviceName: SERVICE_NAME
  });
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
