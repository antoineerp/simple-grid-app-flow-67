
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
    // Essai de plusieurs points d'entrée pour augmenter la fiabilité
    const endpoints = [
      `${getApiUrl()}/index.php`,
      `${getApiUrl()}/db-test.php`,
      `${getApiUrl()}/diagnose-connection.php`
    ];
    
    let lastError = null;
    
    // Essayer chaque endpoint jusqu'à ce qu'un fonctionne
    for (const endpoint of endpoints) {
      try {
        console.log(`Tentative de connexion à: ${endpoint}`);
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
        
        console.log('Réponse du test API:', response.status, response.statusText);
        console.log('Headers:', [...response.headers.entries()]);
        
        // Vérifier si le serveur répond avec du PHP non interprété
        const contentType = response.headers.get('content-type') || '';
        const responseText = await response.text();
        
        console.log('Content-Type:', contentType);
        console.log('Texte de réponse (premiers 100 caractères):', responseText.substring(0, 100));
        
        // Vérifier si la réponse commence par "<?php"
        if (responseText.trim().startsWith('<?php')) {
          lastError = {
            success: false,
            message: 'Le serveur renvoie le code PHP au lieu de l\'exécuter',
            details: {
              tip: 'Vérifiez la configuration du serveur pour exécuter les fichiers PHP. Vérifiez le fichier .htaccess et les permissions.'
            }
          };
          // Continuer avec le prochain endpoint
          continue;
        }
        
        // Essayer de parser la réponse comme JSON
        try {
          const data = JSON.parse(responseText);
          return {
            success: true,
            message: data.message || 'API connectée',
            details: data
          };
        } catch (e) {
          // Si ce n'est pas du JSON mais pas du PHP, c'est peut-être une erreur HTTP
          if (response.ok) {
            return {
              success: true,
              message: 'API connectée (réponse non-JSON)',
              details: {
                responseText: responseText.substring(0, 300)
              }
            };
          } else {
            lastError = {
              success: false,
              message: 'Réponse non-JSON et status HTTP erreur',
              details: {
                error: e instanceof Error ? e.message : String(e),
                responseText: responseText.substring(0, 300),
                status: response.status,
                statusText: response.statusText
              }
            };
            // Continuer avec le prochain endpoint
            continue;
          }
        }
      } catch (endpointError) {
        console.warn(`Erreur avec l'endpoint ${endpoint}:`, endpointError);
        lastError = {
          success: false,
          message: endpointError instanceof Error ? endpointError.message : 'Erreur inconnue',
          details: { error: endpointError }
        };
        // Continuer avec le prochain endpoint
      }
    }
    
    // Si on arrive ici, c'est qu'aucun endpoint n'a fonctionné
    console.error('Tous les endpoints API ont échoué. Dernier erreur:', lastError);
    return lastError || {
      success: false,
      message: 'Aucun endpoint API n\'a répondu correctement',
      details: { endpoints }
    };
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
  detectEnvironment(); // Redétecter l'environnement
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
      // Essayer de lire le corps de la réponse
      let errorMessage = `Erreur HTTP: ${response.status}`;
      try {
        const responseText = await response.text();
        
        // Vérifier si la réponse est du HTML au lieu de JSON
        if (responseText.trim().startsWith('<!DOCTYPE') || 
            responseText.trim().startsWith('<html') ||
            responseText.includes('<body')) {
          console.error('Réponse HTML reçue au lieu de JSON:', responseText.substring(0, 300));
          errorMessage = `Le serveur a renvoyé du HTML au lieu de JSON. Vérifiez la configuration.`;
        } else if (responseText.trim().startsWith('<?php')) {
          console.error('Code PHP non exécuté:', responseText.substring(0, 300));
          errorMessage = `Le serveur renvoie le code PHP au lieu de l'exécuter. Vérifiez la configuration du serveur.`;
        } else {
          // Essayer de parser comme JSON
          try {
            const errorData = JSON.parse(responseText);
            if (errorData && errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (e) {
            // Si la réponse n'est pas du JSON, utiliser le texte brut
            errorMessage = `Erreur: ${responseText.substring(0, 100)}...`;
          }
        }
      } catch (e) {
        errorMessage = `Erreur lors de la lecture de la réponse: ${e instanceof Error ? e.message : String(e)}`;
      }
      
      console.error('Erreur dans fetchWithErrorHandling:', errorMessage);
      throw new Error(errorMessage);
    }
    
    // Si la réponse est vide, retourner un objet vide
    const text = await response.text();
    if (!text) {
      return {};
    }
    
    // Vérifier si la réponse est du HTML
    if (text.trim().startsWith('<!DOCTYPE') || 
        text.trim().startsWith('<html') ||
        text.includes('<body')) {
      console.error('Réponse HTML reçue au lieu de JSON:', text.substring(0, 300));
      throw new Error('Le serveur a renvoyé du HTML au lieu de JSON. Vérifiez la configuration.');
    }
    
    // Vérifier si la réponse est du PHP non exécuté
    if (text.trim().startsWith('<?php')) {
      console.error('Code PHP non exécuté:', text.substring(0, 300));
      throw new Error('Le serveur renvoie le code PHP au lieu de l\'exécuter. Vérifiez la configuration du serveur.');
    }
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Erreur de parsing JSON:", e);
      console.error("Texte reçu:", text.substring(0, 300));
      throw new Error(`Réponse invalide: ${text.substring(0, 100)}...`);
    }
  } catch (error) {
    console.error("Erreur lors de la requête:", error);
    throw error;
  }
}
