
/**
 * Configuration centralisée de l'API
 */

// URL de base de l'API pour l'environnement de production
const PROD_API_URL = 'https://qualiopi.ch/api';

// URL de base de l'API
const API_BASE_URL = PROD_API_URL;

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
    // Ajouter un timeout de 15 secondes pour éviter les attentes infinies
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    console.log(`Requête API vers: ${url}`);
    
    // S'assurer que les en-têtes appropriés sont toujours inclus
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Accept': 'application/json',
      ...(options.headers || {})
    };
    
    // Ajouter l'origine pour Infomaniak CORS
    if (window.location.origin.includes('lovableproject.com')) {
      headers['Origin'] = 'https://qualiopi.ch';
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'include',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`Erreur HTTP: ${response.status} ${response.statusText}`);
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
    // Essayer plusieurs endpoints pour trouver celui qui fonctionne
    const endpoints = [
      'check-db-connection.php',
      'auth-test.php',
      'check.php'
    ];
    
    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Tentative de connexion sur ${endpoint}...`);
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Accept': 'application/json'
          },
          mode: 'cors'
        });
        
        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            message: data.message || "API accessible",
            details: data.details || null
          };
        }
      } catch (err) {
        lastError = err;
        console.log(`Échec avec ${endpoint}, essai suivant...`);
      }
    }
    
    throw lastError || new Error("Tous les endpoints ont échoué");
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
