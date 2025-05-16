
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

// Configuration par défaut - toujours utiliser la production Infomaniak
const DEFAULT_CONFIG: AppConfig = {
  api_urls: {
    development: 'https://qualiopi.ch/api',
    production: 'https://qualiopi.ch/api'
  },
  allowed_origins: {
    development: 'https://qualiopi.ch',
    production: 'https://qualiopi.ch'
  },
  db_config: {
    host: 'p71x6d.myd.infomaniak.com',
    database: 'p71x6d_richard',
    username: 'p71x6d_richard'
  }
};

// Variable cache pour stocker la configuration actuelle en mémoire
let currentConfig: AppConfig | null = null;

/**
 * Récupère la configuration depuis le serveur ou utilise la configuration par défaut
 */
export const getAppConfig = async (): Promise<AppConfig> => {
  try {
    // Si nous avons déjà chargé la configuration, la renvoyer depuis la mémoire
    if (currentConfig) {
      return currentConfig;
    }
    
    // Forcer l'utilisation de la configuration par défaut pour la production
    currentConfig = DEFAULT_CONFIG;
    return DEFAULT_CONFIG;
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
    // Forcer les URLs de production
    newConfig.api_urls.development = 'https://qualiopi.ch/api';
    newConfig.api_urls.production = 'https://qualiopi.ch/api';
    newConfig.allowed_origins.development = 'https://qualiopi.ch';
    newConfig.allowed_origins.production = 'https://qualiopi.ch';
    
    // Mettre à jour le cache en mémoire
    currentConfig = newConfig;
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la configuration:", error);
    return false;
  }
};

/**
 * Réinitialiser la configuration en mémoire
 */
export const resetAppConfig = (): void => {
  currentConfig = DEFAULT_CONFIG;
};
