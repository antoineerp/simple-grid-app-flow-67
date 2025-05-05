
import { Document } from '@/types/documents';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

/**
 * Vérifier que l'endpoint existe
 */
const checkEndpointExists = async (endpoint: string): Promise<boolean> => {
  try {
    console.log(`Vérification de l'existence de l'endpoint: ${endpoint}`);
    const response = await fetch(endpoint, {
      method: 'HEAD',
      headers: getAuthHeaders()
    });
    
    const exists = response.ok || response.status === 200 || response.status === 405;
    console.log(`Endpoint ${endpoint} existe: ${exists} (status: ${response.status})`);
    return exists;
  } catch (e) {
    console.warn(`Erreur lors de la vérification de l'endpoint ${endpoint}:`, e);
    return false;
  }
};

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
    const endpoint = `${API_URL}/documents-sync.php`;
    console.log(`Tentative de synchronisation avec: ${endpoint}`);
    
    // Vérifier que l'endpoint existe avant de l'appeler
    const endpointExists = await checkEndpointExists(endpoint);
    if (!endpointExists) {
      console.error(`L'endpoint ${endpoint} n'existe pas ou n'est pas accessible`);
      throw new Error(`L'endpoint ${endpoint} n'existe pas ou n'est pas accessible`);
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: currentUser, documents })
    });
    
    if (!response.ok) {
      console.error(`Erreur lors de la synchronisation des documents: ${response.status}`);
      
      // Tenter de récupérer les détails de l'erreur
      try {
        const errorText = await response.text();
        console.error("Détails de l'erreur:", errorText);
        
        // Si le texte d'erreur est du JSON, l'analyser
        try {
          const errorJson = JSON.parse(errorText);
          console.error("Détails de l'erreur JSON:", errorJson);
        } catch (e) {
          // Ce n'est pas du JSON, rien à faire
        }
      } catch (textError) {
        console.error("Impossible de lire le corps de l'erreur:", textError);
      }
      
      throw new Error(`Échec de la synchronisation des documents: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Résultat de la synchronisation des documents:", result);
    
    return result.success === true;
  } catch (error) {
    console.error('Erreur de synchronisation:', error);
    return false;
  }
};

/**
 * Loads documents from server
 */
export const loadDocumentsFromServer = async (currentUser: string): Promise<Document[] | null> => {
  try {
    const API_URL = getApiUrl();
    const endpoint = `${API_URL}/documents-load.php`;
    console.log(`Chargement des documents pour l'utilisateur ${currentUser} depuis: ${endpoint}`);
    
    // Vérifier que l'endpoint existe avant de l'appeler
    const endpointExists = await checkEndpointExists(endpoint);
    if (!endpointExists) {
      console.error(`L'endpoint ${endpoint} n'existe pas ou n'est pas accessible`);
      throw new Error(`L'endpoint ${endpoint} n'existe pas ou n'est pas accessible`);
    }
    
    const response = await fetch(`${endpoint}?userId=${encodeURIComponent(currentUser)}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      console.error(`Erreur lors du chargement des documents: ${response.status}`);
      
      // Tenter de récupérer les détails de l'erreur
      try {
        const errorText = await response.text();
        console.error("Détails de l'erreur:", errorText);
        
        // Si le texte d'erreur est du JSON, l'analyser
        try {
          const errorJson = JSON.parse(errorText);
          console.error("Détails de l'erreur JSON:", errorJson);
        } catch (e) {
          // Ce n'est pas du JSON, rien à faire
        }
      } catch (textError) {
        console.error("Impossible de lire le corps de l'erreur:", textError);
      }
      
      throw new Error(`Échec du chargement des documents: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Documents chargés depuis le serveur:", result);
    
    return result.documents || null;
  } catch (error) {
    console.error('Erreur de chargement des documents:', error);
    return null;
  }
};

/**
 * Attempts to check API availability for document endpoints
 */
export const checkDocumentApiAvailability = async (): Promise<{
  loadAvailable: boolean;
  syncAvailable: boolean;
}> => {
  try {
    const API_URL = getApiUrl();
    const result = {
      loadAvailable: false,
      syncAvailable: false
    };
    
    // Check load endpoint
    try {
      const loadResponse = await fetch(`${API_URL}/documents-load.php`, {
        method: 'HEAD',
        headers: getAuthHeaders()
      });
      result.loadAvailable = loadResponse.ok || loadResponse.status === 405;
      console.log(`API documents-load disponible: ${result.loadAvailable} (status: ${loadResponse.status})`);
    } catch (e) {
      console.warn("Endpoint de chargement indisponible:", e);
    }
    
    // Check sync endpoint
    try {
      const syncResponse = await fetch(`${API_URL}/documents-sync.php`, {
        method: 'HEAD',
        headers: getAuthHeaders()
      });
      result.syncAvailable = syncResponse.ok || syncResponse.status === 405;
      console.log(`API documents-sync disponible: ${result.syncAvailable} (status: ${syncResponse.status})`);
    } catch (e) {
      console.warn("Endpoint de synchronisation indisponible:", e);
    }
    
    return result;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'API:", error);
    return {
      loadAvailable: false,
      syncAvailable: false
    };
  }
};
