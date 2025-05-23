
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import type { Utilisateur } from '@/types/auth';

// Cache des utilisateurs pour éviter les requêtes multiples
let usersCache: Utilisateur[] | null = null;
let lastCacheTime: number = 0;
const CACHE_DURATION = 30000; // 30 secondes

/**
 * Efface le cache des utilisateurs
 */
export const clearUsersCache = (): void => {
  usersCache = null;
  lastCacheTime = 0;
  console.log('Cache des utilisateurs effacé');
};

/**
 * Récupère la liste des utilisateurs depuis la base de données
 */
export const getUtilisateurs = async (forceRefresh = false): Promise<Utilisateur[]> => {
  const now = Date.now();
  
  // Utiliser le cache si disponible et récent, sauf si forceRefresh
  if (!forceRefresh && usersCache && (now - lastCacheTime) < CACHE_DURATION) {
    console.log('Utilisation du cache pour les utilisateurs');
    return usersCache;
  }

  try {
    console.log('Récupération des utilisateurs depuis la base de données...');
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/users.php?_t=${now}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Réponse de l\'API users:', data);

    if (data.success === false) {
      throw new Error(data.message || 'Erreur lors de la récupération des utilisateurs');
    }

    // Extraire les utilisateurs de la réponse
    let users: Utilisateur[] = [];
    
    if (data.records && Array.isArray(data.records)) {
      users = data.records;
    } else if (Array.isArray(data)) {
      users = data;
    } else {
      console.warn('Format de réponse inattendu:', data);
      users = [];
    }

    // Mettre à jour le cache
    usersCache = users;
    lastCacheTime = now;
    
    console.log(`${users.length} utilisateurs récupérés de la base de données`);
    return users;

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    
    // En cas d'erreur, retourner le cache s'il existe
    if (usersCache) {
      console.log('Utilisation du cache en cas d\'erreur');
      return usersCache;
    }
    
    throw error;
  }
};

/**
 * S'assure que toutes les tables utilisateur existent
 */
export const ensureAllUserTablesExist = async (): Promise<any[]> => {
  try {
    console.log('Vérification et création des tables pour tous les utilisateurs...');
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/users.php?action=ensure_tables&_t=${Date.now()}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('Résultat de la vérification des tables:', result);
    
    return result.results || [];
  } catch (error) {
    console.error('Erreur lors de la vérification des tables:', error);
    return [];
  }
};
