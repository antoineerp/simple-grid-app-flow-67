
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';

/**
 * Type pour la configuration de l'application
 */
export interface AppConfig {
  api_urls: {
    development: string;
    production: string;
  };
  allowed_origins: {
    development: string;
    production: string;
  };
  db_config?: {
    host: string;
    database: string;
    username: string;
  };
}

// Configuration par défaut (utilisée uniquement si le serveur est inaccessible)
const DEFAULT_CONFIG: AppConfig = {
  api_urls: {
    development: '/api',
    production: '/api'
  },
  allowed_origins: {
    development: '*',
    production: '*'
  }
};

// Variable cache pour stocker la configuration actuelle en mémoire (pas dans localStorage)
let currentConfig: AppConfig | null = null;

/**
 * Récupère la configuration depuis le serveur
 */
export const getAppConfig = async (): Promise<AppConfig> => {
  try {
    // Si nous avons déjà chargé la configuration, la renvoyer depuis la mémoire
    if (currentConfig) {
      return currentConfig;
    }
    
    // Sinon faire la requête au serveur
    console.log("Chargement de la configuration depuis le serveur...");
    const response = await fetch(`${getApiUrl()}/config-test`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    
    const config = await response.json();
    
    // Mettre en cache dans la mémoire (pas dans localStorage)
    currentConfig = config;
    
    return config;
  } catch (error) {
    console.error("Erreur lors du chargement de la configuration:", error);
    
    // En cas d'erreur, utiliser la configuration par défaut
    return DEFAULT_CONFIG;
  }
};

/**
 * Mise à jour de la configuration (administrateurs uniquement)
 */
export const updateAppConfig = async (newConfig: AppConfig): Promise<boolean> => {
  try {
    const response = await fetch(`${getApiUrl()}/config`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newConfig)
    });
    
    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    
    // Mettre à jour le cache en mémoire
    currentConfig = newConfig;
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la configuration:", error);
    return false;
  }
};

/**
 * Réinitialiser la configuration en mémoire (forcer un rechargement depuis le serveur)
 */
export const resetAppConfig = (): void => {
  currentConfig = null;
};
