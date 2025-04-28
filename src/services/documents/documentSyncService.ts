
import { Document } from '@/types/documents';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { loadDocumentsFromStorage, saveDocumentsToStorage } from '@/services/documents';

/**
 * Synchronizes documents with the server
 */
export const syncDocumentsWithServer = async (
  documents: Document[],
  currentUser: string
): Promise<boolean> => {
  try {
    console.log(`Synchronisation des documents pour l'utilisateur ${currentUser}`);
    
    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/documents-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: currentUser, documents })
    });
    
    if (!response.ok) {
      console.error(`Erreur lors de la synchronisation des documents: ${response.status}`);
      const errorText = await response.text();
      console.error("Détails de l'erreur:", errorText);
      throw new Error(`Échec de la synchronisation des documents: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Résultat de la synchronisation des documents:", result);
    
    return result.success === true;
  } catch (error) {
    console.error('Erreur de synchronisation:', error);
    throw error;
  }
};

/**
 * Loads documents from server
 */
export const loadDocumentsFromServer = async (currentUser: string): Promise<Document[] | null> => {
  try {
    const API_URL = getApiUrl();
    console.log(`Chargement des documents pour l'utilisateur ${currentUser} depuis: ${API_URL}/documents-load.php`);
    
    const response = await fetch(`${API_URL}/documents-load.php?userId=${encodeURIComponent(currentUser)}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      console.error(`Erreur lors du chargement des documents: ${response.status}`);
      throw new Error(`Échec du chargement des documents: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Documents chargés depuis le serveur:", result);
    
    // Transform server data to match our Document type
    if (result.success && result.documents) {
      const transformedDocuments = result.documents.map((doc: any) => ({
        id: doc.id || doc.titre,
        nom: doc.titre || doc.nom,
        fichier_path: doc.url_fichier || doc.fichier_path || null,
        responsabilites: doc.responsabilites || { r: [], a: [], c: [], i: [] },
        etat: doc.etat || null,
        date_creation: new Date(doc.date_creation || Date.now()),
        date_modification: new Date(doc.date_modification || Date.now()),
        groupId: doc.groupId || undefined
      }));
      
      // Save to localStorage for offline use
      if (transformedDocuments.length > 0) {
        saveDocumentsToStorage(transformedDocuments, currentUser);
      }
      
      return transformedDocuments;
    }
    
    return null;
  } catch (error) {
    console.error('Erreur de chargement des documents:', error);
    // Fallback to localStorage on server error
    const localDocuments = loadDocumentsFromStorage(currentUser);
    return localDocuments;
  }
};
