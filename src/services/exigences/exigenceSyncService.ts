
import { Exigence, ExigenceGroup } from '@/types/exigences';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

/**
 * Extrait un identifiant utilisateur valide pour les requêtes
 */
const extractValidUserId = (userId: any): string => {
  // Si l'entrée est undefined ou null
  if (userId === undefined || userId === null) {
    console.warn("userId invalide (null/undefined), utilisation de l'ID par défaut");
    return 'p71x6d_system';
  }
  
  // Si c'est déjà une chaîne, la retourner directement
  if (typeof userId === 'string') {
    return userId;
  }
  
  // Si c'est un objet, essayer d'extraire un identifiant
  if (typeof userId === 'object') {
    // Propriétés potentielles pour extraire un ID
    const idProperties = ['identifiant_technique', 'email', 'id'];
    
    for (const prop of idProperties) {
      if (userId[prop] && typeof userId[prop] === 'string') {
        console.log(`ID utilisateur extrait de l'objet: ${prop}=${userId[prop]}`);
        return userId[prop];
      }
    }
    
    // Si nous n'avons pas trouvé d'identifiant valide dans l'objet
    console.warn(`Impossible d'extraire un ID valide depuis l'objet:`, userId);
  }
  
  // Valeur par défaut si aucun identifiant valide n'a été trouvé
  console.warn(`Utilisation de l'ID par défaut pour le type: ${typeof userId}`);
  return 'p71x6d_system';
};

/**
 * Charge les exigences depuis le serveur
 */
export const loadExigencesFromServer = async (userId: any): Promise<{exigences: Exigence[], groups: ExigenceGroup[]}> => {
  try {
    const API_URL = getApiUrl();
    
    // Extraire un identifiant utilisateur valide
    const validUserId = extractValidUserId(userId);
    console.log(`Chargement des exigences pour l'utilisateur ${validUserId} depuis le serveur: ${API_URL}`);
    
    // Vérifier que l'ID est bien une chaîne et non un objet
    if (typeof validUserId !== 'string') {
      throw new Error(`ID utilisateur invalide: ${typeof validUserId}`);
    }
    
    const encodedUserId = encodeURIComponent(validUserId);
    const url = `${API_URL}/exigences-load.php?userId=${encodedUserId}`;
    
    console.log(`Requête vers: ${url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 secondes de timeout
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erreur HTTP lors du chargement des exigences: ${response.status}`, errorText);
        throw new Error(`Erreur serveur: ${response.status}`);
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
      if (error.name === 'AbortError') {
        throw new Error("Délai d'attente dépassé lors du chargement des exigences");
      }
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors du chargement des exigences depuis le serveur:', error);
    throw error;
  }
};

/**
 * Synchronise les exigences avec le serveur
 */
export const syncExigencesWithServer = async (exigences: Exigence[], userId: any, groups: ExigenceGroup[] = []): Promise<boolean> => {
  try {
    const API_URL = getApiUrl();
    
    // Extraire un identifiant utilisateur valide
    const validUserId = extractValidUserId(userId);
    console.log(`Synchronisation des exigences pour l'utilisateur ${validUserId}`);
    
    const requestData = { 
      userId: validUserId,
      exigences,
      groups
    };
    
    console.log("Données à synchroniser:", {
      userId: validUserId,
      exigencesCount: exigences.length,
      groupsCount: groups.length
    });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 secondes de timeout
    
    try {
      const response = await fetch(`${API_URL}/exigences-sync.php`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
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
      if (error.name === 'AbortError') {
        throw new Error("Délai d'attente dépassé lors de la synchronisation");
      }
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de la synchronisation des exigences:', error);
    throw error;
  }
};
