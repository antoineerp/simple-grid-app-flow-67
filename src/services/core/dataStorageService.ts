
import { toast } from '@/components/ui/use-toast';
import { getCurrentUser } from './databaseConnectionService';
import { validateUserId } from './userIdValidator';
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

/**
 * Service centralisé pour la gestion du stockage des données
 * Ce service assure la cohérence entre le stockage local et la base de données
 */

/**
 * Options pour le chargement des données
 */
interface LoadDataOptions {
  forceRefresh?: boolean;
  showToasts?: boolean;
  userId?: string;
  serviceName: string;
}

/**
 * Options pour la sauvegarde des données
 */
interface SaveDataOptions {
  syncWithServer?: boolean;
  showToasts?: boolean;
  userId?: string;
  serviceName: string;
}

/**
 * Charge des données depuis le serveur ou le stockage local
 * @param endpoint - Endpoint API pour le chargement des données
 * @param localKey - Clé pour le stockage local (sans l'ID utilisateur)
 * @param options - Options de chargement
 * @returns Les données chargées
 */
export async function loadData<T>(
  endpoint: string, 
  localKey: string, 
  options: LoadDataOptions
): Promise<T[]> {
  // Récupérer l'ID utilisateur valide
  const userId = validateUserId(options.userId, options.serviceName);
  const fullLocalKey = `${localKey}_${userId}`;
  
  // Si on force le rafraîchissement ou qu'on est en ligne, charger depuis le serveur
  if (options.forceRefresh) {
    try {
      const API_URL = getApiUrl();
      
      console.log(`${options.serviceName}: Chargement des données depuis le serveur pour l'utilisateur ${userId}`);
      
      // Création de l'URL avec l'ID utilisateur
      const url = `${API_URL}/${endpoint}?userId=${encodeURIComponent(userId)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors du chargement des données: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erreur lors du chargement des données');
      }
      
      // Extraire les données du résultat (adaptable selon la structure de la réponse)
      const data = result.data || result[localKey] || [];
      
      // Sauvegarder dans le stockage local
      saveLocalData(fullLocalKey, data);
      
      if (options.showToasts) {
        toast({
          title: 'Données chargées',
          description: `${data.length} éléments chargés depuis le serveur`
        });
      }
      
      return data;
    } catch (error) {
      console.error(`${options.serviceName}: Erreur lors du chargement des données depuis le serveur:`, error);
      
      // En cas d'erreur, charger depuis le stockage local
      const localData = loadLocalData<T>(fullLocalKey);
      
      if (options.showToasts) {
        toast({
          variant: "destructive",
          title: "Erreur de chargement",
          description: "Impossible de se connecter au serveur, utilisation des données locales."
        });
      }
      
      return localData;
    }
  } else {
    // Charger depuis le stockage local
    return loadLocalData<T>(fullLocalKey);
  }
}

/**
 * Sauvegarde des données dans le stockage local et optionnellement les synchronise avec le serveur
 * @param endpoint - Endpoint API pour la synchronisation
 * @param localKey - Clé pour le stockage local (sans l'ID utilisateur)
 * @param data - Les données à sauvegarder
 * @param options - Options de sauvegarde
 * @returns Vrai si la sauvegarde a réussi
 */
export async function saveData<T>(
  endpoint: string, 
  localKey: string, 
  data: T[], 
  options: SaveDataOptions
): Promise<boolean> {
  // Récupérer l'ID utilisateur valide
  const userId = validateUserId(options.userId, options.serviceName);
  const fullLocalKey = `${localKey}_${userId}`;
  
  // Toujours sauvegarder en local d'abord
  saveLocalData(fullLocalKey, data);
  
  // Si la synchronisation avec le serveur est demandée et qu'on a des données
  if (options.syncWithServer && data.length > 0) {
    try {
      const API_URL = getApiUrl();
      
      console.log(`${options.serviceName}: Synchronisation de ${data.length} éléments pour l'utilisateur ${userId}`);
      
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          data
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la synchronisation: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de la synchronisation');
      }
      
      if (options.showToasts) {
        toast({
          title: 'Synchronisation réussie',
          description: `${data.length} éléments synchronisés avec le serveur.`
        });
      }
      
      return true;
    } catch (error) {
      console.error(`${options.serviceName}: Erreur lors de la synchronisation:`, error);
      
      if (options.showToasts) {
        toast({
          variant: "destructive",
          title: "Erreur de synchronisation",
          description: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
      
      return false;
    }
  }
  
  return true;
}

/**
 * Charge des données depuis le stockage local
 * @param key - Clé complète du stockage local
 * @returns Les données chargées
 */
export function loadLocalData<T>(key: string): T[] {
  try {
    const storedData = localStorage.getItem(key);
    
    if (storedData) {
      return JSON.parse(storedData);
    }
    
    return [];
  } catch (error) {
    console.error(`Erreur lors du chargement des données depuis le stockage local (${key}):`, error);
    return [];
  }
}

/**
 * Sauvegarde des données dans le stockage local
 * @param key - Clé complète du stockage local
 * @param data - Les données à sauvegarder
 */
export function saveLocalData<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`${data.length} éléments sauvegardés dans ${key}`);
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde des données dans le stockage local (${key}):`, error);
  }
}
