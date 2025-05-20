
import { Membre } from '@/types/membres';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';

// Cache pour les membres
let membresCache: Membre[] | null = null;
let lastFetchTimestamp: number | null = null;
const CACHE_DURATION = 60000; // 1 minute de cache

/**
 * Service pour la gestion des membres (ressources humaines)
 */
export const getMembres = async (forceRefresh: boolean = false): Promise<Membre[]> => {
  // Retourner les données du cache si disponibles et pas encore expirées
  if (!forceRefresh && membresCache && lastFetchTimestamp && (Date.now() - lastFetchTimestamp < CACHE_DURATION)) {
    console.log("Utilisation du cache pour les membres", membresCache.length);
    return membresCache;
  }

  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      console.log("Aucun token d'authentification trouvé, retour d'un tableau vide");
      // Au lieu de lancer une erreur, retourner un tableau vide
      return [];
    }

    const API_URL = getApiUrl();
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || 'p71x6d_system';
    console.log(`Chargement des membres pour l'utilisateur: ${userId}`);

    const response = await fetch(`${API_URL}/check-users.php?userId=${userId}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur HTTP ${response.status}: ${errorText}`);
      return []; // Retourner un tableau vide en cas d'erreur
    }

    const data = await response.json();
    console.log("Réponse brute de check-users.php:", data);
    
    // Si les données sont vides, retourner un tableau vide
    if (!data) {
      return [];
    }
    
    // Déterminer où se trouvent les données dans la réponse
    let records: Membre[] = [];
    
    if (Array.isArray(data)) {
      records = data;
    } else if (data.records && Array.isArray(data.records)) {
      records = data.records;
    } else if (data.membres && Array.isArray(data.membres)) {
      records = data.membres;
    } else if (data.data && Array.isArray(data.data)) {
      records = data.data;
    } else {
      console.warn("Format de réponse non reconnu pour les membres");
      records = [];
    }

    // Mettre à jour le cache
    membresCache = records;
    lastFetchTimestamp = Date.now();
    
    // Sauvegarder en local également
    localStorage.setItem(`membres_${userId}`, JSON.stringify(records));
    
    return records;
  } catch (error) {
    console.error("Erreur lors de la récupération des membres:", error);
    
    // Essayer de récupérer depuis le stockage local
    try {
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || 'p71x6d_system';
      const localData = localStorage.getItem(`membres_${userId}`);
      
      if (localData) {
        const parsedData = JSON.parse(localData);
        console.log("Utilisation des données locales pour les membres");
        return parsedData;
      }
    } catch (localError) {
      console.error("Erreur lors de la lecture des données locales des membres:", localError);
    }
    
    // En cas d'erreur, retourner un tableau vide pour éviter de bloquer l'UI
    return [];
  }
};

export const clearMembresCache = (): void => {
  membresCache = null;
  lastFetchTimestamp = null;
  console.log("Cache membres effacé");
};
