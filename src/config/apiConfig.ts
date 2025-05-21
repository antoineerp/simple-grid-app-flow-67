
// Configuration API

// Récupère l'URL de base de l'API
export const getApiUrl = (): string => {
  // Utilise l'URL actuelle comme base pour l'API
  const baseUrl = window.location.origin;
  return `${baseUrl}/api`;
};

// Récupère l'URL complète de l'API (incluant le protocole et le domaine)
export const getFullApiUrl = (): string => {
  return getApiUrl();
};

// Récupère les en-têtes d'authentification
export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  return token ? {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : {
    'Content-Type': 'application/json'
  };
};

// Fonction pour tester la connexion à l'API
export const testApiConnection = async (): Promise<{ 
  success: boolean; 
  message: string; 
  details?: any;
}> => {
  try {
    const apiUrl = getApiUrl();
    console.log("Testing API connection to:", apiUrl);
    
    const response = await fetch(`${apiUrl}/test.php`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }
    
    const responseText = await response.text();
    
    // Vérifier si la réponse contient du PHP non exécuté
    if (responseText.includes('<?php') || responseText.includes('<br />') || responseText.includes('<!DOCTYPE')) {
      throw new Error("La réponse contient du PHP/HTML au lieu de JSON - problème de configuration serveur");
    }
    
    // Essayer de parser le JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Erreur de parsing JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
    
    return {
      success: true,
      message: data.message || 'API connection successful',
      details: data
    };
  } catch (error) {
    console.error("API connection error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      details: { error }
    };
  }
};

// Fonction pour gérer les erreurs lors des requêtes fetch
export const fetchWithErrorHandling = async (
  url: string, 
  options: RequestInit = {}
): Promise<any> => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      // Essayer d'obtenir les détails de l'erreur si disponibles
      let errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // Si la réponse n'est pas du JSON, on utilise le message d'erreur par défaut
        console.warn("Couldn't parse error response:", parseError);
      }
      
      throw new Error(errorMessage);
    }
    
    // Vérifier le type de contenu
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.indexOf('application/json') !== -1) {
      return await response.json();
    } else {
      // Si ce n'est pas du JSON, retourner le texte brut
      const text = await response.text();
      try {
        // Tenter de parser en JSON même si le header ne l'indique pas
        return JSON.parse(text);
      } catch {
        // Sinon retourner le texte tel quel
        return text;
      }
    }
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};
