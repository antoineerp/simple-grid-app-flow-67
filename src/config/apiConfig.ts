
// Configuration de l'API et fonctions utilitaires pour les appels API

// URL de base de l'API - Détecte automatiquement l'environnement
const getBaseApiUrl = () => {
  // Si nous sommes en développement local (port 5173, 5174, etc.)
  if (window.location.port.startsWith('517')) {
    console.log("Environnement de développement détecté, utilisation de l'API locale");
    return '/api';
  } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log("Environnement localhost détecté, utilisation de l'API locale");
    return '/api';
  } else {
    // Sur l'environnement de production
    console.log("Environnement de production détecté");
    const baseUrl = window.location.protocol + '//' + window.location.host;
    return `${baseUrl}/api`;
  }
};

export const API_BASE_URL = getBaseApiUrl();

// Test de connexion à l'API pour s'assurer que le serveur est disponible
export const testApiConnection = async () => {
  try {
    console.log(`Test de connexion à l'API: ${API_BASE_URL}`);
    const response = await fetch(`${API_BASE_URL}/login-test.php?test=1`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log(`Réponse du test API: ${response.status}`);
    if (!response.ok) {
      console.error(`Erreur API: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(`Réponse: ${text}`);
      return { success: false, message: `Erreur ${response.status}: ${response.statusText}`, status: response.status };
    }
    
    const data = await response.json();
    console.log("Données de test API reçues:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Erreur lors du test de l'API:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Erreur de connexion à l'API",
      error
    };
  }
};

// Fonction générique pour faire des appels API avec gestion d'erreur
export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const url = `${API_BASE_URL}/${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`;
    console.log(`Appel API: ${url}`);
    
    // Assurer les bons headers par défaut
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    };
    
    // Fusionner les options par défaut avec celles fournies
    const mergedOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      }
    };
    
    const response = await fetch(url, mergedOptions);
    
    if (!response.ok) {
      console.error(`Erreur API: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(`Réponse: ${text}`);
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Erreur lors de l'appel API à ${endpoint}:`, error);
    throw error;
  }
};
