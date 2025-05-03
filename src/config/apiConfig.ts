/**
 * Configuration de l'API centrale
 */

let API_URL = '';
let FULL_API_URL = '';

export function getApiUrl(): string {
  if (!API_URL) {
    API_URL = initializeApiUrl();
  }
  return API_URL;
}

export function getFullApiUrl(): string {
  if (!FULL_API_URL) {
    FULL_API_URL = initializeFullApiUrl();
  }
  return FULL_API_URL;
}

// Initialisation de l'URL de l'API en fonction de l'environnement
function initializeApiUrl(): string {
  const savedApiUrl = localStorage.getItem('apiUrl');
  
  // Si une URL est sauvegardée et elle est valide, l'utiliser
  if (savedApiUrl && isValidUrl(savedApiUrl)) {
    console.log("Utilisation de l'URL API sauvegardée:", savedApiUrl);
    return savedApiUrl;
  }

  // Détection de l'environnement
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const port = window.location.port;

  let baseApiUrl;
  
  // Forcer l'utilisation du chemin /api sur Infomaniak
  if (hostname.includes('myd.infomaniak.com') || hostname.includes('qualiopi.ch')) {
    console.log("Environnement Infomaniak détecté, utilisation du chemin /api");
    baseApiUrl = '/api';
  }
  // Config pour développement local
  else if (isLocalhost) {
    console.log("Environnement local détecté");
    baseApiUrl = port === '5173' || port === '5174' ? '/api' : '/api';
  }
  // Pour les déploiements sur d'autres plateformes
  else {
    console.log("Autre environnement détecté, utilisation du chemin relatif /api");
    baseApiUrl = '/api';
  }

  // Sauvegarder l'URL pour les prochains chargements
  localStorage.setItem('apiUrl', baseApiUrl);
  console.log("URL API initialisée:", baseApiUrl);
  
  return baseApiUrl;
}

// Initialisation de l'URL complète de l'API
function initializeFullApiUrl(): string {
  const baseApiUrl = getApiUrl();
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  
  // Si l'URL de base est déjà absolue, la retourner telle quelle
  if (baseApiUrl.startsWith('http')) {
    console.log("URL API complète (absolue):", baseApiUrl);
    return baseApiUrl;
  }

  // Sinon, construire l'URL complète
  const fullUrl = `${protocol}//${hostname}${port}${baseApiUrl.startsWith('/') ? baseApiUrl : `/${baseApiUrl}`}`;
  console.log("URL API complète (construite):", fullUrl);
  
  return fullUrl;
}

// Validation d'URL
function isValidUrl(url: string): boolean {
  // Accepter les URL absolues et les chemins relatifs commençant par '/'
  return url.startsWith('http') || url.startsWith('/');
}

// Fonction pour les requêtes HTTP avec gestion d'erreur
export async function fetchWithErrorHandling(url: string, options?: RequestInit): Promise<any> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
    }
    
    // Vérifier si la réponse est du JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    // Si ce n'est pas du JSON, retourner le texte
    return await response.text();
  } catch (error) {
    console.error(`Erreur lors de la requête à ${url}:`, error);
    throw error;
  }
}

// Test de connexion à l'API
export async function testApiConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    const apiUrl = getApiUrl();
    
    if (!apiUrl) {
      return {
        success: false,
        message: "URL de l'API non configurée"
      };
    }
    
    console.log(`Test de connexion à l'API: ${apiUrl}/check.php`);
    
    const response = await fetch(`${apiUrl}/check.php`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    });
    
    // Traitement de la réponse
    const contentType = response.headers.get('content-type');
    let responseData;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      
      // Vérifier si la réponse contient du code PHP non exécuté
      if (text.includes('<?php')) {
        return {
          success: false,
          message: "Le serveur renvoie du code PHP non exécuté",
          details: {
            tip: "Vérifiez que PHP est correctement configuré sur votre serveur."
          }
        };
      }
      
      // Essayer de parser le texte comme du JSON si possible
      try {
        responseData = JSON.parse(text);
      } catch (e) {
        return {
          success: false,
          message: `Réponse non-JSON reçue: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`,
          details: {
            responseText: text.substring(0, 500),
            contentType
          }
        };
      }
    }
    
    if (response.ok && responseData?.status === 'success') {
      return {
        success: true,
        message: responseData.message || "API connectée avec succès",
        details: responseData
      };
    } else {
      return {
        success: false,
        message: responseData?.message || `Erreur HTTP: ${response.status}`,
        details: responseData
      };
    }
  } catch (error) {
    console.error("Erreur lors du test de l'API:", error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
      details: {
        error: String(error),
        apiUrl: getApiUrl()
      }
    };
  }
}

// Définir manuellement l'URL de l'API
export function setApiUrl(url: string): void {
  if (isValidUrl(url)) {
    localStorage.setItem('apiUrl', url);
    API_URL = url;
    FULL_API_URL = ''; // Réinitialiser l'URL complète pour qu'elle soit recalculée
    console.log("URL API définie manuellement:", url);
  } else {
    console.error("URL API invalide:", url);
  }
}
