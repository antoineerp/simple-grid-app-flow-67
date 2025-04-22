
// Configuration de l'API
export const getApiUrl = (): string => {
  // Si une URL personnalisée est définie dans le localStorage, l'utiliser
  if (localStorage.getItem('customApiUrl')) {
    return localStorage.getItem('customApiUrl') as string;
  }
  
  // Si on est sur qualiopi.ch, utiliser un chemin spécifique
  if (window.location.hostname === 'qualiopi.ch') {
    // Vérifier si nous sommes dans un sous-dossier
    if (window.location.pathname.includes('/sites/')) {
      // Extraire le chemin du sous-dossier
      const pathMatch = window.location.pathname.match(/^(\/sites\/[^\/]+)/);
      if (pathMatch && pathMatch[1]) {
        return `${pathMatch[1]}/api`;
      }
    }
    // Si nous sommes à la racine du domaine ou pas de sous-dossier détecté
    return '/sites/qualiopi.ch/api';
  }
  
  // Utiliser un chemin relatif par défaut pour fonctionner sur tout domaine
  return '/api';
};

// Définir une URL d'API personnalisée (utile pour le développement ou tests)
export const setCustomApiUrl = (url: string): void => {
  if (url && url.trim() !== '') {
    // Normaliser l'URL pour éviter les double slashes
    const normalizedUrl = url.trim().replace(/\/+$/, '');
    localStorage.setItem('customApiUrl', normalizedUrl);
    console.log(`URL d'API personnalisée définie: ${normalizedUrl}`);
  }
};

// Réinitialiser à l'URL d'API par défaut
export const resetToDefaultApiUrl = (): void => {
  localStorage.removeItem('customApiUrl');
  console.log("URL d'API réinitialisée à la valeur par défaut");
};

// Vérifier si l'application utilise une URL d'API personnalisée
export const isUsingCustomApiUrl = (): boolean => {
  return !!localStorage.getItem('customApiUrl');
};

// Obtenir l'URL d'API complète (pour affichage uniquement)
export const getFullApiUrl = (): string => {
  const baseUrl = isUsingCustomApiUrl() 
    ? localStorage.getItem('customApiUrl') as string
    : window.location.hostname === 'qualiopi.ch' 
      ? window.location.origin + '/sites/qualiopi.ch/api'
      : window.location.origin + '/api';
  
  // Normaliser l'URL pour éviter les double slashes
  return baseUrl.replace(/([^:]\/)\/+/g, "$1");
};

// Fonction utilitaire pour traiter les réponses JSON
export const safelyParseJSON = (text: string): any => {
  try {
    // Tenter de parser le JSON
    return JSON.parse(text);
  } catch (e) {
    // Journaliser l'erreur
    console.error("Erreur lors du parsing JSON:", e);
    console.warn("Contenu reçu:", text.substring(0, 500) + (text.length > 500 ? "..." : ""));
    
    // Si la réponse est un HTML (probablement une erreur 500 ou autre page d'erreur)
    if (text.includes("<!DOCTYPE") || text.includes("<html")) {
      return { 
        error: true, 
        message: "La réponse du serveur n'est pas au format JSON (HTML reçu)",
        originalResponse: text.substring(0, 100) + "..."
      };
    }
    
    // Pour les autres formats non-JSON
    return {
      error: true,
      message: "Impossible de traiter la réponse du serveur",
      originalResponse: text.substring(0, 100) + "..."
    };
  }
};

// Fonction pour faciliter les requêtes API avec gestion d'erreur intégrée
export const fetchWithErrorHandling = async (url: string, options: RequestInit = {}): Promise<any> => {
  try {
    // Ajouter des headers par défaut
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Accept': 'application/json'
    };
    
    // Fusionner les options avec les valeurs par défaut
    const mergedOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      }
    };
    
    console.log(`Requête API à: ${url}`, { 
      method: mergedOptions.method || 'GET'
    });
    
    // Faire la requête
    const response = await fetch(url, mergedOptions);
    const textResponse = await response.text();
    
    // Essayer de traiter la réponse comme du JSON
    const jsonData = safelyParseJSON(textResponse);
    
    // Si safelyParseJSON a détecté une erreur de parsing
    if (jsonData && jsonData.error === true) {
      console.error("Erreur API:", jsonData.message);
      throw new Error(jsonData.message);
    }
    
    // Si la réponse HTTP n'est pas OK
    if (!response.ok) {
      const errorMessage = jsonData.message || jsonData.error || `Erreur HTTP ${response.status}`;
      console.error("Erreur API:", errorMessage);
      throw new Error(errorMessage);
    }
    
    return jsonData;
  } catch (error) {
    console.error("Erreur lors de la requête API:", error);
    throw error;
  }
};
