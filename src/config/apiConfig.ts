
/**
 * Configuration centralisée de l'API
 */

// URL de base de l'API
const API_BASE_URL = 'https://qualiopi.ch/api';

/**
 * Obtient l'URL de l'API
 * @returns URL de l'API
 */
export const getApiUrl = (): string => {
  return API_BASE_URL;
};

/**
 * Construit une URL d'API complète
 * @param endpoint Point de terminaison de l'API (sans le slash initial)
 * @returns URL complète
 */
export const buildApiUrl = (endpoint: string): string => {
  // S'assurer que l'endpoint ne commence pas par un slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Délai maximal pour les requêtes API (en ms)
export const API_TIMEOUT = 15000;

// Statut de l'API (pour les tests)
export const API_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  DEGRADED: 'degraded'
};
