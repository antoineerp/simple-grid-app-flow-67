
import { Document, DocumentGroup } from '@/types/documents';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { toast } from '@/components/ui/use-toast';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { loadData, saveData, loadLocalData, saveLocalData } from '@/services/core/dataStorageService';

// Nom du service pour le logging
const SERVICE_NAME = 'documentsService';

/**
 * Charge les documents depuis le serveur et met à jour le stockage local
 */
export const loadDocumentsFromServer = async (forceRefresh: boolean = false): Promise<Document[]> => {
  return loadData<Document>('documents-load.php', 'documents', {
    forceRefresh,
    showToasts: true,
    serviceName: SERVICE_NAME
  });
};

/**
 * Synchronise les documents avec le serveur
 */
export const syncDocumentsWithServer = async (documents: Document[]): Promise<boolean> => {
  return saveData<Document>('documents-sync.php', 'documents', documents, {
    syncWithServer: true,
    showToasts: true,
    serviceName: SERVICE_NAME
  });
};

/**
 * Charge les documents depuis le stockage local
 */
export const loadDocumentsFromStorage = (): Document[] => {
  const userId = getCurrentUser();
  return loadLocalData<Document>(`documents_${userId}`);
};

/**
 * Sauvegarde les documents dans le stockage local
 */
export const saveDocumentsToStorage = (documents: Document[]): void => {
  const userId = getCurrentUser();
  saveLocalData(`documents_${userId}`, documents);
};
