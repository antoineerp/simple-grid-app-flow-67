
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
    const response = await fetch(`${API_URL}/bibliotheque-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: currentUser, documents, groups })
    });
    
    if (!response.ok) {
      console.error(`Erreur lors de la synchronisation de la bibliothèque: ${response.status}`);
      const errorText = await response.text();
      console.error("Détails de l'erreur:", errorText);
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
    console.log(`Chargement de la bibliothèque pour l'utilisateur ${currentUser} depuis: ${API_URL}/bibliotheque-load.php`);
    
    const response = await fetch(`${API_URL}/bibliotheque-load.php?userId=${encodeURIComponent(currentUser)}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      console.error(`Erreur lors du chargement de la bibliothèque: ${response.status}`);
      throw new Error(`Échec du chargement de la bibliothèque: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Bibliothèque chargée depuis le serveur:", result);
    
    if (result.success && result.documents && result.groups) {
      // Associer les documents aux groupes
      const groupMap = new Map(result.groups.map((group: DocumentGroup) => [group.id, { ...group, items: [] }]));
      
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
