
// Configuration API

// Récupère l'URL de base de l'API
export const getApiUrl = (): string => {
  // Utilise l'URL actuelle comme base pour l'API
  const baseUrl = window.location.origin;
  
  // Pour le développement local, utiliser une URL fixe
  if (baseUrl.includes('localhost') || baseUrl.includes('lovable.app') || baseUrl.includes('lovableproject.com')) {
    console.log('Environnement de développement détecté - utilisation de l\'API directe');
    return `${baseUrl}/api`;
  }
  
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
    
    // Test direct de login-test.php qui est plus fiable pour les tests
    const response = await fetch(`${apiUrl}/login-test.php?test=1&_t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    // Si le serveur PHP ne fonctionne pas, essayer un test avec .json pour voir si le serveur répond
    if (!response.ok) {
      try {
        const jsonTest = await fetch(`${apiUrl}/test-connection.json?_t=${Date.now()}`);
        if (jsonTest.ok) {
          return {
            success: false,
            message: "Le serveur répond mais les scripts PHP ne sont pas exécutés. Veuillez vérifier la configuration du serveur.",
            details: {
              tip: "Les fichiers PHP ne sont pas exécutés correctement. Vérifiez que PHP est installé et configuré sur votre serveur."
            }
          };
        }
      } catch (e) {
        // Ignore l'erreur et continue
      }
      
      throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
    }
    
    const responseText = await response.text();
    
    // Vérifier si la réponse contient du PHP non exécuté
    if (responseText.includes('<?php')) {
      console.error("Réponse PHP non exécutée:", responseText.substring(0, 100));
      return {
        success: false,
        message: "Le serveur renvoie du code PHP au lieu de JSON. Vérifiez la configuration du serveur.",
        details: {
          tip: "Votre serveur ne traite pas les fichiers PHP. Assurez-vous que PHP est correctement installé et configuré."
        }
      };
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
      return {
        success: false,
        message: "Réponse invalide: impossible de parser le JSON",
        details: { 
          response: responseText.substring(0, 255),
          error: e
        }
      };
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
    
    // Si la réponse est vide, renvoyer un objet vide
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
