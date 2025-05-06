
// Configuration de l'API
let apiUrl = '/api';
let isCustomUrl = false;

// Détection automatique de l'environnement
function detectEnvironment() {
  const hostname = window.location.hostname;
  const isInfomaniak = hostname.includes('myd.infomaniak.com') || hostname.includes('qualiopi.ch');
  
  console.log('Détection d\'environnement - Hostname:', hostname);
  console.log('Détection d\'environnement - Est Infomaniak:', isInfomaniak);
  
  if (isInfomaniak) {
    // Configuration pour Infomaniak - utiliser le chemin relatif au domaine
    apiUrl = '/api';
    console.log('Environnement Infomaniak détecté - API URL:', apiUrl);
  } else {
    // Pour l'environnement de développement ou preview Lovable
    apiUrl = '/api';
    console.log('Environnement de développement détecté - API URL:', apiUrl);
  }
}

// Forcer une détection initiale
detectEnvironment();

// Obtenir l'URL de l'API
export function getApiUrl(): string {
  return apiUrl;
}

// Obtenir l'URL complète de l'API (avec le hostname)
export function getFullApiUrl(): string {
  return apiUrl.startsWith('http') 
    ? apiUrl 
    : `${window.location.protocol}//${window.location.host}${apiUrl}`;
}

// Diagnostic de l'API simple
export async function testApiConnection(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    console.log(`Test de connexion à l'API: ${getFullApiUrl()}`);
    const response = await fetch(`${getApiUrl()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    console.log('Réponse du test API:', response.status, response.statusText);
    console.log('Headers:', [...response.headers.entries()]);
    
    const responseText = await response.text();
    
    // Essayer de parser la réponse comme JSON
    try {
      const data = JSON.parse(responseText);
      return {
        success: true,
        message: data.message || 'API connectée',
        details: data
      };
    } catch (e) {
      return {
        success: false,
        message: 'Réponse non-JSON',
        details: {
          error: e instanceof Error ? e.message : String(e),
          responseText: responseText.substring(0, 300)
        }
      };
    }
  } catch (error) {
    console.error('Erreur lors du test API:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      details: { error }
    };
  }
}

// Définir une URL personnalisée pour l'API
export function setCustomApiUrl(url: string): void {
  apiUrl = url;
  isCustomUrl = true;
  console.log('URL API personnalisée définie:', url);
}

// Réinitialiser l'URL de l'API à sa valeur par défaut
export function resetToDefaultApiUrl(): void {
  detectEnvironment();
  isCustomUrl = false;
  console.log('URL API réinitialisée à la valeur par défaut:', apiUrl);
}

// Vérifier si une URL personnalisée est utilisée
export function isUsingCustomApiUrl(): boolean {
  return isCustomUrl;
}

// Fonction utilitaire pour les requêtes fetch avec gestion d'erreur
export async function fetchWithErrorHandling(url: string, options?: RequestInit): Promise<any> {
  try {
    console.log(`Requête vers: ${url}`, options);
    const response = await fetch(url, options);
    
    console.log(`Réponse reçue: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const text = await response.text();
    if (!text) {
      return {};
    }
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Erreur de parsing JSON:", e);
      throw new Error(`Réponse invalide: ${text.substring(0, 100)}...`);
    }
  } catch (error) {
    console.error("Erreur lors de la requête:", error);
    throw error;
  }
}
