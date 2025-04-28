
import { Exigence, ExigenceGroup } from '@/types/exigences';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

/**
 * Charge les exigences depuis le serveur
 */
export const loadExigencesFromServer = async (userId: string): Promise<{exigences: Exigence[], groups: ExigenceGroup[]}> => {
  try {
    const API_URL = getApiUrl();
    console.log(`Chargement des exigences pour l'utilisateur ${userId} depuis le serveur: ${API_URL}`);
    
    const encodedUserId = encodeURIComponent(userId);
    const url = `${API_URL}/exigences-load.php?userId=${encodedUserId}`;
    
    console.log(`Requête vers: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur HTTP lors du chargement des exigences: ${response.status}`, errorText);
      throw new Error(`Erreur serveur: ${response.status} ${response.statusText}`);
    }
    
    const responseText = await response.text();
    
    try {
      const result = JSON.parse(responseText);
      
      if (!result.success) {
        throw new Error(result.message || "Échec du chargement des exigences");
      }
      
      // Conversion des dates pour les objets exigences
      const exigences = (result.exigences || []).map((exigence: any) => ({
        ...exigence,
        date_creation: exigence.date_creation ? new Date(exigence.date_creation) : new Date(),
        date_modification: exigence.date_modification ? new Date(exigence.date_modification) : new Date(),
        exclusion: Boolean(exigence.exclusion)
      }));
      
      // Conversion du champ expanded pour les groupes
      const groups = (result.groups || []).map((group: any) => ({
        ...group,
        expanded: Boolean(group.expanded),
        items: [] // Initialiser le tableau items pour la compatibilité avec l'interface ExigenceGroup
      }));
      
      console.log(`Exigences chargées: ${exigences.length}, Groupes chargés: ${groups.length}`);
      
      return { exigences, groups };
    } catch (e) {
      console.error("Erreur lors du parsing de la réponse:", e);
      console.error("Réponse brute reçue:", responseText);
      throw new Error("Impossible de traiter la réponse du serveur");
    }
  } catch (error) {
    console.error('Erreur lors du chargement des exigences depuis le serveur:', error);
    throw error;
  }
};

/**
 * Synchronise les exigences avec le serveur
 */
export const syncExigencesWithServer = async (exigences: Exigence[], userId: string, groups: ExigenceGroup[] = []): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    console.log(`Synchronisation des exigences pour l'utilisateur ${userId}`);
    
    const requestData = { 
      userId,
      exigences,
      groups
    };
    
    console.log("Données à synchroniser:", {
      userId,
      exigencesCount: exigences.length,
      groupsCount: groups.length
    });
    
    const response = await fetch(`${API_URL}/exigences-sync.php`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur HTTP lors de la synchronisation: ${response.status}`, errorText);
      
      if (errorText.trim().startsWith('{')) {
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || `Échec de la synchronisation: ${response.statusText}`);
        } catch (e) {
          console.error("Impossible de parser l'erreur JSON:", e);
        }
      }
      
      throw new Error(`Échec de la synchronisation: ${response.statusText}`);
    }
    
    const responseText = await response.text();
    
    try {
      const result = JSON.parse(responseText);
      console.log("Résultat de la synchronisation des exigences:", result);
      
      if (!result.success) {
        throw new Error(result.message || "Erreur de synchronisation inconnue");
      }
      
      return true;
    } catch (e) {
      console.error("Erreur lors du parsing de la réponse:", e);
      console.error("Réponse brute reçue:", responseText);
      throw new Error("Impossible de traiter la réponse du serveur");
    }
  } catch (error) {
    console.error('Erreur lors de la synchronisation des exigences:', error);
    throw error;
  }
};
