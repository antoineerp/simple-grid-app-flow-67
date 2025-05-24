
// Configuration API - UNIQUEMENT base de données Infomaniak

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

// Fonction pour tester la connexion à l'API - UNIQUEMENT base de données
export const testApiConnection = async (): Promise<{ 
  success: boolean; 
  message: string; 
  details?: any;
}> => {
  try {
    const apiUrl = getApiUrl();
    console.log("Test de connexion EXCLUSIVEMENT à la base de données Infomaniak:", apiUrl);
    
    // Utiliser UNIQUEMENT l'endpoint de test de la base de données
    const response = await fetch(`${apiUrl}/test?action=test_db&_t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    if (!response.ok) {
      throw new Error(`ERREUR BASE DE DONNÉES: HTTP ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`ERREUR BASE DE DONNÉES: ${data.message || "Test de connexion à la base de données échoué"}`);
    }
    
    return {
      success: true,
      message: `✅ Connexion à la base de données Infomaniak réussie: ${data.message || "Base de données accessible"}`,
      details: data
    };
  } catch (error) {
    console.error("❌ Erreur de connexion à la base de données Infomaniak:", error);
    return {
      success: false,
      message: `❌ ERREUR BASE DE DONNÉES: ${error instanceof Error ? error.message : "Connexion à la base de données Infomaniak impossible"}`,
      details: { error }
    };
  }
};

// Fonction unifiée pour gérer les requêtes fetch - UNIQUEMENT base de données
export const fetchWithErrorHandling = async (
  url: string, 
  options: RequestInit = {}
): Promise<any> => {
  try {
    console.log(`Requête à la base de données Infomaniak: ${url}`);
    
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
      let errorMessage = `ERREUR BASE DE DONNÉES: HTTP ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = `ERREUR BASE DE DONNÉES: ${errorData.message}`;
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
      console.error("Erreur de parsing JSON depuis la base de données:", e);
      throw new Error("ERREUR BASE DE DONNÉES: Réponse invalide - impossible de parser le JSON");
    }
  } catch (error) {
    console.error("❌ Erreur fetch base de données:", error);
    throw error;
  }
};
