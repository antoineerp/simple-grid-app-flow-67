
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
      throw new Error("Utilisateur non authentifié");
    }

    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/membres-load.php`, {
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
      throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    
    // Si les données sont vides, retourner un tableau vide
    if (!data || !data.records) {
      return [];
    }

    // Mettre à jour le cache
    membresCache = data.records;
    lastFetchTimestamp = Date.now();
    
    return data.records;
  } catch (error) {
    console.error("Erreur lors de la récupération des membres:", error);
    // En cas d'erreur, retourner un tableau vide pour éviter de bloquer l'UI
    return [];
  }
};

export const clearMembresCache = (): void => {
  membresCache = null;
  lastFetchTimestamp = null;
  console.log("Cache membres effacé");
};
