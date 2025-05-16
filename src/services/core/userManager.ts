import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '../auth/authService';
import { getDatabaseConnectionCurrentUser } from '../core/databaseConnectionService';
import { getDeviceId } from '../core/userService';
import { Utilisateur } from '@/types/user';

// Un cache simple pour les utilisateurs
let userCache: Utilisateur[] | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Récupère la liste des utilisateurs depuis l'API
 */
export const getUtilisateurs = async (): Promise<Utilisateur[]> => {
  // Utiliser le cache si disponible et récent
  if (userCache && (Date.now() - lastFetchTime < CACHE_DURATION)) {
    console.log("Utilisation du cache pour getUtilisateurs");
    return userCache;
  }

  try {
    console.log("Récupération des utilisateurs depuis l'API");
    const API_URL = getApiUrl();
    
    if (!API_URL) {
      throw new Error("URL de l'API non configurée");
    }
    
    const response = await fetch(`${API_URL}/check-users.php`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Vérifier le format de la réponse et extraire les utilisateurs
    if (data && data.records && Array.isArray(data.records)) {
      userCache = data.records;
      lastFetchTime = Date.now();
      return data.records;
    } else if (data && Array.isArray(data)) {
      userCache = data;
      lastFetchTime = Date.now();
      return data;
    }
    
    throw new Error("Format de réponse invalide");
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    
    // En cas d'erreur, retourner le cache s'il existe, même s'il est périmé
    if (userCache) {
      console.log("Utilisation du cache périmé après erreur");
      return userCache;
    }
    
    throw error;
  }
};

/**
 * Rafraîchit la liste des utilisateurs en ignorant le cache
 */
export const refreshUtilisateurs = async (): Promise<Utilisateur[]> => {
  // Réinitialiser le cache
  userCache = null;
  lastFetchTime = 0;
  
  // Récupérer les données fraîches
  return getUtilisateurs();
};
