
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
    
    // Ajouter un timestamp pour éviter la mise en cache
    const timestamp = new Date().getTime();
    
    // Pour le test direct, utiliser info.php qui renvoie l'état du serveur
    const response = await fetch(`${getApiUrl()}/info.php?_t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      // Timeout après 5 secondes
      signal: AbortSignal.timeout(5000)
    });
    
    console.log('Réponse du test API:', response.status, response.statusText);
    
    const responseText = await response.text();
    
    try {
      // Vérifier si la réponse commence par "<?php"
      if (responseText.trim().startsWith('<?php')) {
        console.error('Le serveur renvoie du code PHP au lieu de l\'exécuter:', responseText.substring(0, 100));
        return {
          success: false,
          message: 'Le serveur renvoie du code PHP au lieu de l\'exécuter',
          details: {
            error: 'Configuration PHP incorrecte',
            responseText: responseText.substring(0, 300),
            tip: 'Vérifiez que PHP est correctement configuré sur votre serveur et que les fichiers .php sont bien interprétés.'
          }
        };
      }
      
      // Essayer de parser le JSON
      const data = JSON.parse(responseText);
      console.log('Test de connectivité API réussi');
      return {
        success: true,
        message: data.message || 'API connectée',
        details: data
      };
    } catch (e) {
      console.error('Réponse API non-JSON:', responseText.substring(0, 100));
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
    
    // Message d'erreur spécifique pour les timeouts
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      return {
        success: false,
        message: 'Délai d\'attente dépassé lors de la connexion à l\'API',
        details: { error: 'Timeout', timeoutMs: 5000 }
      };
    }
    
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
    console.log(`Requête vers: ${url}`, options?.method || 'GET');
    
    // Ajouter un timeout à la requête si non spécifié
    const controller = options?.signal ? undefined : new AbortController();
    const signal = options?.signal || (controller ? controller.signal : undefined);
    const timeoutId = controller ? setTimeout(() => controller.abort(), 10000) : undefined; // 10 secondes
    
    const response = await fetch(url, {
      ...options,
      signal
    });
    
    if (timeoutId) clearTimeout(timeoutId);
    
    console.log(`Réponse reçue: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    if (!text) {
      return {};
    }
    
    // Vérifier si la réponse commence par "<?php"
    if (text.trim().startsWith('<?php')) {
      throw new Error('Le serveur renvoie du code PHP au lieu de l\'exécuter. Vérifiez la configuration du serveur.');
    }
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Erreur de parsing JSON:", e);
      console.log("Réponse brute:", text.substring(0, 300)); // Log de la réponse brute limitée
      
      // Si le texte contient "success" ou des données qui ressemblent à un résultat valide,
      // essayer de le transformer en un objet simple
      if (text.includes('success') || text.includes('data')) {
        return { rawText: text, success: text.includes('success') };
      }
      
      throw new Error(`Réponse invalide: ${text.substring(0, 100)}...`);
    }
  } catch (error) {
    // Détecter les erreurs de timeout
    if (error.name === 'AbortError') {
      console.error("Timeout de la requête:", error);
      throw new Error("La requête a pris trop de temps à s'exécuter et a été annulée.");
    }
    
    console.error("Erreur lors de la requête:", error);
    throw error;
  }
}
