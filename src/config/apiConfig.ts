
// Configuration de l'API
let apiUrl = '/api';

// Pour les environnements de production spécifiques (comme Infomaniak)
if (window.location.hostname === 'qualiopi.ch') {
  apiUrl = '/sites/qualiopi.ch/api';
}

// Obtenir l'URL de l'API
export function getApiUrl(): string {
  return apiUrl;
}

// Obtenir l'URL complète de l'API (avec le hostname)
export function getFullApiUrl(): string {
  return `${window.location.protocol}//${window.location.host}${apiUrl}`;
}

// Fonction utilitaire pour les requêtes fetch avec gestion d'erreur
export async function fetchWithErrorHandling(url: string, options?: RequestInit): Promise<any> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      // Essayer de lire le corps de la réponse
      let errorMessage = `Erreur HTTP: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // Si la réponse n'est pas du JSON, utiliser le texte brut
        const text = await response.text();
        errorMessage = `Erreur: ${text.substring(0, 100)}...`;
      }
      
      throw new Error(errorMessage);
    }
    
    // Si la réponse est vide, retourner un objet vide
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
