
import { Document, DocumentGroup } from '@/types/documents';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { toast } from '@/components/ui/use-toast';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

/**
 * Charge les documents depuis le serveur et met à jour le stockage local
 */
export const loadDocumentsFromServer = async (): Promise<Document[]> => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    console.log(`Chargement des documents depuis le serveur pour l'utilisateur ${userId}`);
    
    const response = await fetch(`${API_URL}/documents-load.php?userId=${userId}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors du chargement des documents: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erreur lors du chargement des documents');
    }
    
    // Mise à jour du stockage local
    saveDocumentsToStorage(result.documents || []);
    
    return result.documents || [];
  } catch (error) {
    console.error('Erreur lors du chargement des documents depuis le serveur:', error);
    
    // En cas d'erreur, essayer de récupérer depuis le stockage local
    const documents = loadDocumentsFromStorage();
    return documents;
  }
};

/**
 * Synchronise les documents avec le serveur
 */
export const syncDocumentsWithServer = async (documents: Document[]): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    console.log(`Synchronisation de ${documents.length} documents pour l'utilisateur ${userId}`);
    
    const response = await fetch(`${API_URL}/documents-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        documents
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la synchronisation des documents: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erreur lors de la synchronisation des documents');
    }
    
    toast({
      title: 'Synchronisation réussie',
      description: `${documents.length} documents synchronisés avec le serveur.`
    });
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la synchronisation des documents:', error);
    
    toast({
      variant: 'destructive',
      title: 'Erreur de synchronisation',
      description: error instanceof Error ? error.message : 'Erreur inconnue'
    });
    
    return false;
  }
};

/**
 * Charge les documents depuis le stockage local
 */
export const loadDocumentsFromStorage = (): Document[] => {
  try {
    const userId = getCurrentUser();
    const storedDocuments = localStorage.getItem(`documents_${userId}`);
    
    if (storedDocuments) {
      return JSON.parse(storedDocuments);
    }
    
    return [];
  } catch (error) {
    console.error('Erreur lors du chargement des documents depuis le stockage local:', error);
    return [];
  }
};

/**
 * Sauvegarde les documents dans le stockage local
 */
export const saveDocumentsToStorage = (documents: Document[]): void => {
  try {
    const userId = getCurrentUser();
    localStorage.setItem(`documents_${userId}`, JSON.stringify(documents));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des documents dans le stockage local:', error);
  }
};
