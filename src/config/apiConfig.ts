
// Configuration de l'API
const apiUrl = getApiBaseUrl();

// Fonction pour déterminer l'URL de base de l'API en fonction de l'environnement
function getApiBaseUrl(): string {
  // Toujours utiliser le chemin relatif pour la production et le développement
  return '/api';
}

// Obtenir l'URL de l'API
export function getApiUrl(): string {
  return apiUrl;
}

// Obtenir l'URL complète de l'API (avec le hostname)
export function getFullApiUrl(): string {
  return `${window.location.protocol}//${window.location.host}${apiUrl}`;
}

// Diagnostic de l'API simple
export async function testApiConnection(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    console.log(`Test de connexion à l'API: ${getFullApiUrl()}`);
    
    // Pour le test direct, utiliser info.php qui renvoie l'état du serveur
    const response = await fetch(`${getApiUrl()}/info.php`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    console.log('Réponse du test API:', response.status, response.statusText);
    
    const responseText = await response.text();
    
    try {
      const data = JSON.parse(responseText);
      console.log('Test de connectivité API réussi');
      return {
        success: true,
        message: data.message || 'API connectée',
        details: data
      };
    } catch (e) {
      console.error('Erreur de parsing JSON:', e);
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
