
import { Exigence } from '@/types/exigences';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { toast } from '@/components/ui/use-toast';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { loadData, saveData, loadLocalData, saveLocalData } from '@/services/core/dataStorageService';

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
  const userId = getCurrentUser();
  return loadLocalData<Exigence>(`exigences_${userId}`);
};

/**
 * Sauvegarde les exigences dans le stockage local
 */
export const saveExigencesToStorage = (exigences: Exigence[]): void => {
  const userId = getCurrentUser();
  saveLocalData(`exigences_${userId}`, exigences);
};
