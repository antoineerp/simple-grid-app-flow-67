
// Configuration de l'API
let apiUrl = '/api';
let isCustomUrl = false;

// Pour les environnements de production spécifiques (comme Infomaniak)
if (window.location.hostname === 'qualiopi.ch') {
  apiUrl = '/sites/qualiopi.ch/api';
  console.log('Environnement de production détecté: qualiopi.ch - API URL:', apiUrl);
}

// Obtenir l'URL de l'API
export function getApiUrl(): string {
  return apiUrl;
}

// Obtenir l'URL complète de l'API (avec le hostname)
export function getFullApiUrl(): string {
  return `${window.location.protocol}//${window.location.host}${apiUrl}`;
}

// Définir une URL personnalisée pour l'API
export function setCustomApiUrl(url: string): void {
  apiUrl = url;
  isCustomUrl = true;
  console.log('URL API personnalisée définie:', url);
}

// Réinitialiser l'URL de l'API à sa valeur par défaut
export function resetToDefaultApiUrl(): void {
  if (window.location.hostname === 'qualiopi.ch') {
    apiUrl = '/sites/qualiopi.ch/api';
  } else {
    apiUrl = '/api';
  }
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
