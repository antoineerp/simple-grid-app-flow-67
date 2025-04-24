
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

/**
 * Synchronizes bibliotheque with the server
 */
export const syncBibliothequeWithServer = async (
  documents: Document[],
  groups: DocumentGroup[],
  currentUser: string
): Promise<boolean> => {
  try {
    console.log(`Synchronisation de la bibliothèque pour l'utilisateur ${currentUser}`);
    
    const API_URL = getApiUrl();
    const endpoint = `${API_URL}/bibliotheque-sync.php`;
    console.log(`Tentative de synchronisation avec: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: currentUser, documents, groups })
    });
    
    if (!response.ok) {
      console.error(`Erreur lors de la synchronisation de la bibliothèque: ${response.status}`);
      
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
      
      throw new Error(`Échec de la synchronisation de la bibliothèque: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Résultat de la synchronisation de la bibliothèque:", result);
    
    return result.success === true;
  } catch (error) {
    console.error('Erreur de synchronisation de la bibliothèque:', error);
    return false;
  }
};

/**
 * Loads bibliotheque from server
 */
export const loadBibliothequeFromServer = async (currentUser: string): Promise<{documents: Document[], groups: DocumentGroup[]} | null> => {
  try {
    const API_URL = getApiUrl();
    const endpoint = `${API_URL}/bibliotheque-load.php`;
    console.log(`Chargement de la bibliothèque pour l'utilisateur ${currentUser} depuis: ${endpoint}`);
    
    const response = await fetch(`${endpoint}?userId=${encodeURIComponent(currentUser)}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      console.error(`Erreur lors du chargement de la bibliothèque: ${response.status}`);
      
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
      
      throw new Error(`Échec du chargement de la bibliothèque: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Bibliothèque chargée depuis le serveur:", result);
    
    if (result.success && result.documents && result.groups) {
      // Associer les documents aux groupes
      const groupMap = new Map<string, DocumentGroup>();
      
      // Create properly typed groups
      result.groups.forEach((group: { id: string; name: string; expanded: boolean }) => {
        groupMap.set(group.id, { 
          id: group.id, 
          name: group.name, 
          expanded: Boolean(group.expanded), 
          items: [] 
        });
      });
      
      // Séparer les documents par groupe
      const groupedDocs: Document[] = [];
      const ungroupedDocs: Document[] = [];
      
      result.documents.forEach((doc: Document) => {
        if (doc.groupId && groupMap.has(doc.groupId)) {
          groupedDocs.push(doc);
          const group = groupMap.get(doc.groupId);
          if (group) {
            group.items.push(doc);
          }
        } else {
          ungroupedDocs.push(doc);
        }
      });
      
      return {
        documents: ungroupedDocs,
        groups: Array.from(groupMap.values())
      };
    }
    
    return null;
  } catch (error) {
    console.error('Erreur de chargement de la bibliothèque:', error);
    return null;
  }
};

/**
 * Attempts to check API availability for bibliotheque endpoints
 */
export const checkBibliothequeApiAvailability = async (): Promise<{
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
      const loadResponse = await fetch(`${API_URL}/bibliotheque-load.php`, {
        method: 'HEAD',
        headers: getAuthHeaders()
      });
      result.loadAvailable = loadResponse.ok;
    } catch (e) {
      console.warn("Endpoint de chargement de la bibliothèque indisponible:", e);
    }
    
    // Check sync endpoint
    try {
      const syncResponse = await fetch(`${API_URL}/bibliotheque-sync.php`, {
        method: 'HEAD',
        headers: getAuthHeaders()
      });
      result.syncAvailable = syncResponse.ok;
    } catch (e) {
      console.warn("Endpoint de synchronisation de la bibliothèque indisponible:", e);
    }
    
    return result;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'API de la bibliothèque:", error);
    return {
      loadAvailable: false,
      syncAvailable: false
    };
  }
};
