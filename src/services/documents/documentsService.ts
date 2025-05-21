
import { Document } from '@/types/documents';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { toast } from '@/components/ui/use-toast';
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { loadData, saveData } from '@/services/core/dataStorageService';
import { getUserStorageKey } from '@/services/core/userIdValidator';

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
  const storageKey = getUserStorageKey('documents');
  
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
 * Sauvegarde les documents dans le stockage local
 */
export const saveDocumentsToStorage = (documents: Document[]): void => {
  const storageKey = getUserStorageKey('documents');
  
  try {
    localStorage.setItem(storageKey, JSON.stringify(documents));
  } catch (error) {
    console.error(`${SERVICE_NAME}: Erreur lors de la sauvegarde des données locales:`, error);
    toast({
      variant: "destructive",
      title: "Erreur de stockage",
      description: "Impossible de sauvegarder les données localement. Vérifiez l'espace disponible."
    });
  }
};
