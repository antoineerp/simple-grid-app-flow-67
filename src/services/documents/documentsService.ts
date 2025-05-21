
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { getCurrentUser } from '../auth/authService';

// Récupère tous les documents
export const getDocuments = async () => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    const response = await fetch(`${API_URL}/documents-load.php?userId=${userId}`, {
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
    return data.documents || [];
  } catch (error) {
    console.error("Erreur lors de la récupération des documents:", error);
    return [];
  }
};

// Crée un nouveau document
export const createDocument = async (document: any) => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    const response = await fetch(`${API_URL}/documents-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        documents: [document]
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.success ? document : null;
  } catch (error) {
    console.error("Erreur lors de la création d'un document:", error);
    throw error;
  }
};

// Met à jour un document existant
export const updateDocument = async (document: any) => {
  try {
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    const response = await fetch(`${API_URL}/documents-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        documents: [document]
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.success ? document : null;
  } catch (error) {
    console.error("Erreur lors de la mise à jour d'un document:", error);
    throw error;
  }
};

// Supprime un document
export const deleteDocument = async (documentId: string) => {
  try {
    // Pour la suppression, nous récupérons tous les documents, supprimons celui qui correspond
    // et synchronisons le tout
    const documents = await getDocuments();
    const updatedDocuments = documents.filter(doc => doc.id !== documentId);
    
    const API_URL = getApiUrl();
    const userId = getCurrentUser();
    
    const response = await fetch(`${API_URL}/documents-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        documents: updatedDocuments
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Erreur lors de la suppression d'un document:", error);
    return false;
  }
};
