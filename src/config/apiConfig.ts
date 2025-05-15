
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
 * Obtient l'URL complète de l'API
 */
export const getFullApiUrl = (): string => {
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

/**
 * Effectue une requête fetch avec gestion d'erreur
 */
export const fetchWithErrorHandling = async (url: string, options: RequestInit = {}): Promise<any> => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Erreur de requête:", error);
    throw error;
  }
};

/**
 * Teste la connexion à l'API
 */
export const testApiConnection = async () => {
  try {
    const response = await fetchWithErrorHandling(`${API_BASE_URL}/check.php`);
    return {
      success: true,
      message: response.message || "API accessible",
      details: response.details || null
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur de connexion à l'API",
      details: null
    };
  }
};

// Délai maximal pour les requêtes API (en ms)
export const API_TIMEOUT = 15000;

// Statut de l'API (pour les tests)
export const API_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  DEGRADED: 'degraded'
};
