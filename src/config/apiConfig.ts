
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
    console.log("Test de connexion à l'API:", apiUrl);
    
    // Test direct de l'API test.php qui a plus de chances de fonctionner
    const response = await fetch(`${apiUrl}/test.php?_t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
    }
    
    const responseText = await response.text();
    
    // Vérifier si la réponse contient du PHP non exécuté
    if (responseText.includes('<?php')) {
      console.error("Réponse PHP non exécutée:", responseText.substring(0, 100));
      throw new Error("Le serveur renvoie du code PHP au lieu de JSON. Vérifiez la configuration du serveur.");
    }
    
    // Essayer de parser la réponse en JSON
    try {
      const data = JSON.parse(responseText);
      return {
        success: true,
        message: data.message || "Connexion API réussie",
        details: data
      };
    } catch (e) {
      console.error("Erreur lors du parsing JSON:", e);
      throw new Error("Réponse invalide: impossible de parser le JSON");
    }
  } catch (error) {
    console.error("Erreur de connexion API:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur inconnue",
      details: { error }
    };
  }
};

// Fonction améliorée pour gérer les requêtes fetch
export const fetchWithErrorHandling = async (
  url: string, 
  options: RequestInit = {}
): Promise<any> => {
  try {
    console.log(`Requête à ${url}`);
    
    // Ajouter un timestamp pour éviter la mise en cache
    const urlWithTimestamp = url.includes('?') 
      ? `${url}&_t=${Date.now()}` 
      : `${url}?_t=${Date.now()}`;
    
    // S'assurer que les en-têtes par défaut sont présents
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
      // Essayer d'obtenir les détails de l'erreur si disponibles
      let errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // Si la réponse n'est pas du JSON, utiliser le message d'erreur par défaut
      }
      
      throw new Error(errorMessage);
    }
    
    const responseText = await response.text();
    
    // Vérifier si la réponse contient du PHP non exécuté
    if (responseText.includes('<?php')) {
      console.error("Réponse PHP non exécutée:", responseText.substring(0, 100));
      throw new Error("Le serveur renvoie du code PHP au lieu de JSON. Vérifiez la configuration du serveur.");
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
