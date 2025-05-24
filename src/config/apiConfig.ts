
// Configuration API - Version unifiée

// Récupère l'URL de base de l'API
export const getApiUrl = (): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/api`;
};

// Récupère l'URL complète de l'API
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
    console.log("Test de connexion à l'API:", apiUrl);
    
    const response = await fetch(`${apiUrl}/test?action=connection&_t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      message: data.message || "Connexion API réussie",
      details: data
    };
  } catch (error) {
    console.error("Erreur de connexion API:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur inconnue",
      details: { error }
    };
  }
};

// Fonction unifiée pour gérer les requêtes fetch
export const fetchWithErrorHandling = async (
  url: string, 
  options: RequestInit = {}
): Promise<any> => {
  try {
    console.log(`Requête à ${url}`);
    
    const urlWithTimestamp = url.includes('?') 
      ? `${url}&_t=${Date.now()}` 
      : `${url}?_t=${Date.now()}`;
    
    const mergedOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    };
    
    const response = await fetch(urlWithTimestamp, mergedOptions);
    
    if (!response.ok) {
      let errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // Utiliser le message d'erreur par défaut
      }
      throw new Error(errorMessage);
    }
    
    const responseText = await response.text();
    
    if (!responseText.trim()) {
      return {};
    }
    
    try {
      return JSON.parse(responseText);
    } catch (e) {
      console.error("Erreur de parsing JSON:", e);
      throw new Error("Réponse invalide: impossible de parser le JSON");
    }
  } catch (error) {
    console.error("Erreur fetch:", error);
    throw error;
  }
};
