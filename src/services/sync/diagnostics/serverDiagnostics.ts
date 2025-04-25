
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { validateApiResponse, isPhpContent } from '../validators/apiResponseValidator';

/**
 * Vérifie si le serveur PHP exécute correctement le code ou renvoie du code PHP brut
 */
export const testServerPhpExecution = async (): Promise<{
  success: boolean;
  message: string;
  phpExecuting: boolean;
}> => {
  try {
    const API_URL = getApiUrl();
    const endpoint = `${API_URL}/user-profile-load.php`;
    const requestId = `diag_${new Date().getTime()}_${Math.random().toString(36).substring(2, 9)}`;
    
    console.log(`🧪 DIAGNOSTIC - Test d'exécution PHP sur ${endpoint}`);
    
    const response = await fetch(`${endpoint}?requestId=${requestId}`, {
      method: 'OPTIONS',
      headers: {
        ...getAuthHeaders(),
        'X-Request-ID': requestId,
        'X-Client-Source': 'diagnostics',
      }
    });
    
    const responseText = await response.text();
    
    // Vérifier si la réponse est du code PHP brut
    if (responseText.trim().startsWith('<?php') || responseText.includes('<?php')) {
      console.error('❌ DIAGNOSTIC - Le serveur renvoie du code PHP brut');
      return { 
        success: false, 
        message: "Le serveur ne peut pas exécuter PHP correctement. Contactez votre administrateur.", 
        phpExecuting: false 
      };
    }
    
    try {
      // Essayer de parser la réponse comme du JSON
      const jsonResponse = JSON.parse(responseText);
      console.log('✅ DIAGNOSTIC - Le serveur exécute PHP correctement', jsonResponse);
      
      return { 
        success: true, 
        message: "Le serveur exécute PHP correctement", 
        phpExecuting: jsonResponse.php_check?.php_executing || false
      };
    } catch (e) {
      console.error('❌ DIAGNOSTIC - Réponse non JSON', responseText);
      return { 
        success: false, 
        message: "Le serveur renvoie une réponse invalide (non JSON)", 
        phpExecuting: false 
      };
    }
    
  } catch (error) {
    console.error('❌ DIAGNOSTIC - Erreur lors du test PHP', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Erreur inconnue lors du diagnostic", 
      phpExecuting: false 
    };
  }
};

/**
 * Effectue un diagnostic complet de la connexion à l'API
 */
export const diagnoseApiConnection = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    const API_URL = getApiUrl();
    console.log(`🧪 DIAGNOSTIC API - Test de connexion à ${API_URL}`);
    
    const response = await fetch(`${API_URL}/test.php`, {
      method: 'GET',
      headers: {
        'X-Client-Source': 'diagnostics',
        'Cache-Control': 'no-cache'
      }
    });
    
    // Si la réponse n'est pas ok, on retourne une erreur
    if (!response.ok) {
      return {
        success: false,
        message: `Erreur HTTP: ${response.status} - ${response.statusText}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          tip: "Vérifiez que le serveur est en ligne et accessible."
        }
      };
    }
    
    // Vérifier si la réponse est du code PHP brut
    const responseText = await response.text();
    if (isPhpContent(responseText)) {
      return {
        success: false,
        message: "Le serveur renvoie du code PHP au lieu de l'exécuter",
        details: {
          response: responseText.substring(0, 200),
          tip: "Vérifiez la configuration PHP sur le serveur."
        }
      };
    }
    
    // Essayer de parser la réponse comme du JSON
    try {
      const jsonResponse = JSON.parse(responseText);
      return {
        success: true,
        message: jsonResponse.message || "Connexion à l'API réussie",
        details: jsonResponse
      };
    } catch (e) {
      return {
        success: false,
        message: "Réponse non-JSON reçue du serveur",
        details: {
          response: responseText.substring(0, 200),
          tip: "Vérifiez que le script PHP renvoie une réponse JSON valide."
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur inconnue lors du diagnostic",
      details: {
        error: error instanceof Error ? error.message : "Erreur inconnue",
        tip: "Vérifiez votre connexion réseau et l'URL de l'API."
      }
    };
  }
};

/**
 * Vérifie spécifiquement si PHP est correctement configuré sur le serveur
 */
export const checkPhpServerStatus = async (): Promise<{
  isWorking: boolean;
  detail: string;
  errorCode?: string;
}> => {
  try {
    const API_URL = getApiUrl();
    console.log(`🧪 DIAGNOSTIC PHP - Test d'exécution PHP sur ${API_URL}`);
    
    const response = await fetch(`${API_URL}/phpinfo.php`, {
      method: 'HEAD',
      headers: {
        'X-Client-Source': 'diagnostics',
        'Cache-Control': 'no-cache'
      }
    });
    
    // Si le fichier phpinfo.php est accessible, essayons de vérifier le contenu
    if (response.ok) {
      // Faire une requête GET pour voir le contenu
      const contentResponse = await fetch(`${API_URL}/phpinfo.php`, {
        method: 'GET',
        headers: {
          'X-Client-Source': 'diagnostics',
          'Cache-Control': 'no-cache'
        }
      });
      
      const contentText = await contentResponse.text();
      
      // Si la réponse est du code PHP brut
      if (isPhpContent(contentText)) {
        return {
          isWorking: false,
          detail: contentText.substring(0, 200),
          errorCode: 'PHP_EXECUTION_ERROR'
        };
      }
      
      // Si la réponse contient des informations PHP, c'est bon signe
      if (contentText.includes('PHP Version') || contentText.includes('phpinfo()')) {
        return {
          isWorking: true,
          detail: "PHP est correctement configuré"
        };
      }
      
      // Sinon, on ne sait pas trop
      return {
        isWorking: false,
        detail: "Le serveur répond mais PHP ne semble pas correctement configuré",
        errorCode: 'PHP_UNKNOWN_CONFIG'
      };
    } else {
      return {
        isWorking: false,
        detail: `Le fichier phpinfo.php n'est pas accessible (${response.status})`,
        errorCode: 'PHPINFO_NOT_ACCESSIBLE'
      };
    }
  } catch (error) {
    return {
      isWorking: false,
      detail: error instanceof Error ? error.message : "Erreur inconnue lors du diagnostic PHP",
      errorCode: 'PHP_DIAGNOSTIC_ERROR'
    };
  }
};

/**
 * Vérifie si les API de synchronisation sont disponibles et fonctionnelles
 */
export const testSyncEndpoints = async (): Promise<{
  success: boolean;
  endpoints: { [key: string]: boolean };
}> => {
  try {
    const API_URL = getApiUrl();
    const endpoints = [
      'user-profile-load.php',
      'user-profile-sync.php',
      'documents-load.php',
      'documents-sync.php',
      'exigences-load.php',
      'exigences-sync.php',
      'membres-load.php',
      'membres-sync.php',
    ];
    
    const results: { [key: string]: boolean } = {};
    
    // Tester chaque endpoint
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${API_URL}/${endpoint}`, {
          method: 'HEAD',
          headers: getAuthHeaders()
        });
        
        // Les endpoints HEAD peuvent renvoyer 405 Method Not Allowed mais cela signifie qu'ils existent
        results[endpoint] = response.ok || response.status === 405;
        console.log(`🧪 DIAGNOSTIC - Endpoint ${endpoint}: ${results[endpoint] ? '✅' : '❌'} (${response.status})`);
      } catch (e) {
        results[endpoint] = false;
        console.warn(`🧪 DIAGNOSTIC - Erreur lors du test de ${endpoint}:`, e);
      }
    }
    
    const allEndpointsAvailable = Object.values(results).every(result => result === true);
    
    return {
      success: allEndpointsAvailable,
      endpoints: results
    };
  } catch (error) {
    console.error('❌ DIAGNOSTIC - Erreur lors du test des endpoints', error);
    return {
      success: false,
      endpoints: {}
    };
  }
};

