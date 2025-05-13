
// Configuration de l'API
// Ce fichier centralise les paramètres de connexion à l'API

// Définir l'URL de base de l'API - toujours vers Infomaniak
export const getApiUrl = (): string => {
  // Toujours utiliser le chemin relatif pour Infomaniak
  return '/api';
};

// Obtenir l'URL complète de l'API
export const getFullApiUrl = (): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/api`;
};

// Helper pour gérer les erreurs de fetch de manière cohérente
export const fetchWithErrorHandling = async (url: string, options: RequestInit = {}): Promise<any> => {
  try {
    const response = await fetch(url, options);
    
    // Si la réponse n'est pas OK, lancer une erreur
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      
      try {
        // Tenter de parser le message d'erreur comme JSON
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || `Erreur HTTP: ${response.status}`;
      } catch (e) {
        // Si ce n'est pas du JSON, utiliser le texte brut
        errorMessage = `Erreur HTTP: ${response.status} - ${errorText.substring(0, 100)}${errorText.length > 100 ? '...' : ''}`;
      }
      
      throw new Error(errorMessage);
    }
    
    // Tenter de parser la réponse comme JSON
    try {
      return await response.json();
    } catch (e) {
      const text = await response.text();
      console.error("Échec du parsing JSON:", text.substring(0, 200));
      throw new Error(`La réponse n'est pas au format JSON valide: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
    }
  } catch (error) {
    console.error("Erreur fetch:", error);
    throw error;
  }
};

// Tester la connexion à l'API
export const testApiConnection = async (): Promise<{ 
  success: boolean; 
  message: string;
  details?: any;
}> => {
  try {
    console.log('Testing API connection to:', getFullApiUrl());
    
    // Utiliser un timeout pour éviter d'attendre trop longtemps
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${getFullApiUrl()}/simple-test.php`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Récupérer le texte de réponse pour analyse
    const responseText = await response.text();
    console.log('API test response:', responseText.substring(0, 200));
    
    // Détecter si nous avons une réponse PHP brute (non exécutée)
    if (responseText.includes('<?php') || responseText.trim().startsWith('<?php')) {
      return {
        success: false,
        message: 'PHP non exécuté - le code PHP est renvoyé au lieu d\'être traité',
        details: {
          tip: 'Votre serveur web ne traite pas les fichiers PHP. Vérifiez la configuration PHP sur votre serveur.'
        }
      };
    }
    
    // Vérifier si c'est du HTML au lieu de JSON
    if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
      return {
        success: false,
        message: 'Réponse HTML reçue au lieu de JSON',
        details: {
          tip: 'L\'API renvoie une page HTML au lieu de JSON. Vérifiez la configuration du serveur.'
        }
      };
    }
    
    // Essayer de parser le JSON
    try {
      const data = JSON.parse(responseText);
      
      if (data && data.status === 'success') {
        return {
          success: true,
          message: data.message || 'API connectée avec succès'
        };
      } else {
        return {
          success: false,
          message: data.message || 'Erreur de connexion à l\'API',
          details: data
        };
      }
    } catch (parseError) {
      return {
        success: false,
        message: 'Réponse non-JSON',
        details: {
          error: parseError.message,
          response: responseText.substring(0, 200)
        }
      };
    }
  } catch (error) {
    console.error('API connection test error:', error);
    
    // Gérer l'erreur d'avortement (timeout)
    if (error.name === 'AbortError') {
      return {
        success: false,
        message: 'Délai d\'attente dépassé lors de la connexion à l\'API',
        details: {
          error: 'Timeout'
        }
      };
    }
    
    return {
      success: false,
      message: error.message || 'Erreur de connexion à l\'API',
      details: {
        error: error.toString()
      }
    };
  }
};
