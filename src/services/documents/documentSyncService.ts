
import { Document } from '@/types/documents';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

/**
 * Chargement des documents depuis le serveur pour un utilisateur spécifique
 */
export const loadDocumentsFromServer = async (userId: string): Promise<Document[]> => {
  try {
    console.log(`Chargement des documents pour l'utilisateur ${userId}`);
    
    // Ajout du paramètre userId au lieu de user pour correspondre au backend
    const response = await fetch(`${getApiUrl()}/documents-load.php?userId=${userId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Documents chargés depuis le serveur:", result);
    
    if (result.success && Array.isArray(result.documents)) {
      return result.documents;
    } else if (Array.isArray(result)) {
      return result;
    }
    
    return [];
  } catch (error) {
    console.error('Erreur lors du chargement des documents:', error);
    // En cas d'erreur, renvoyer un tableau vide
    return [];
  }
};

/**
 * Synchronisation des documents avec le serveur
 */
export const syncDocumentsWithServer = async (documents: Document[], userId: string): Promise<boolean> => {
  try {
    console.log(`Synchronisation des documents pour l'utilisateur ${userId}`);
    
    const response = await fetch(`${getApiUrl()}/documents-sync.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        user: userId,
        documents: documents
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Résultat de la synchronisation des documents:", result);
    
    return result.success === true;
  } catch (error) {
    console.error('Erreur lors de la synchronisation des documents:', error);
    return false;
  }
};
