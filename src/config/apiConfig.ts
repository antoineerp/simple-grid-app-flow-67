
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
    // Tester avec le nouveau fichier CGI test
    console.log(`Test de connexion à l'API: ${getFullApiUrl()}/cgi-test.php`);
    const response = await fetch(`${getApiUrl()}/cgi-test.php`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    console.log('Réponse du test API:', response.status, response.statusText);
    console.log('Headers:', [...response.headers.entries()]);
    
    const responseText = await response.text();
    
    if (!responseText || responseText.trim() === '') {
      console.warn('Réponse vide reçue du serveur');
      return {
        success: false,
        message: 'Le serveur a renvoyé une réponse vide',
        details: {
          status: response.status,
          statusText: response.statusText
        }
      };
    }
    
    // Vérifier si la réponse contient du code PHP non exécuté
    if (responseText.includes('<?php') || responseText.includes('<?=')) {
      console.error('Le code PHP n\'est pas exécuté', responseText.substring(0, 200));
      return {
        success: false,
        message: 'Le serveur renvoie le code PHP au lieu de l\'exécuter. Vérifiez votre configuration CGI/FastCGI.',
        details: {
          responseText: responseText.substring(0, 300),
          tip: 'Assurez-vous que le module PHP est activé sur votre serveur et que .htaccess est correctement configuré.'
        }
      };
    }
    
    // Vérifier si la réponse contient du HTML au lieu du JSON
    if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
      console.error('Réponse HTML reçue au lieu de JSON', responseText.substring(0, 200));
      return {
        success: false,
        message: 'Le serveur a renvoyé une page HTML au lieu de JSON.',
        details: {
          responseText: responseText.substring(0, 300),
          tip: 'Vérifiez votre configuration .htaccess et assurez-vous que le module PHP est correctement configuré.'
        }
      };
    }
    
    // Essayer de parser la réponse comme JSON
    try {
      const data = JSON.parse(responseText);
      
      // Vérifier si nous avons une réponse de succès du test CGI
      if (data && data.status === 'success' && data.message) {
        let executionMode = data.php_info?.execution_mode || 'Non détecté';
        
        return {
          success: true,
          message: `API connectée: ${data.message}`,
          details: {
            php_version: data.php_info?.php_version,
            sapi_name: data.php_info?.sapi_name,
            execution_mode: executionMode
          }
        };
      }
      
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
