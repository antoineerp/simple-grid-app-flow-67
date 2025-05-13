
// Configuration de l'API
// Ce fichier centralise les paramètres de connexion à l'API

// Définir l'URL de base de l'API en fonction de l'environnement
export const getApiUrl = (): string => {
  // Vérifier si nous sommes sur le domaine Infomaniak
  const hostname = window.location.hostname;
  const isInfomaniak = hostname.includes('myd.infomaniak.com') || 
                      hostname.includes('qualiopi.ch');
  
  // Si nous sommes sur Infomaniak, utiliser le chemin relatif
  if (isInfomaniak) {
    return '/api';
  }
  
  // En développement local, utiliser localhost
  if (process.env.NODE_ENV === 'development') {
    // Le port 5173 est celui utilisé par Vite en développement
    return 'http://localhost:5173/api';
  }
  
  // Par défaut, utiliser un chemin relatif
  return '/api';
};

// Obtenir l'URL complète de l'API
export const getFullApiUrl = (): string => {
  const baseUrl = window.location.origin;
  const apiPath = getApiUrl();
  
  // Si l'URL de l'API est déjà absolue, la retourner directement
  if (apiPath.startsWith('http')) {
    return apiPath;
  }
  
  // Sinon, combiner avec l'origine actuelle
  return `${baseUrl}${apiPath}`;
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
    
    const response = await fetch(`${getFullApiUrl()}/test.php`, {
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
