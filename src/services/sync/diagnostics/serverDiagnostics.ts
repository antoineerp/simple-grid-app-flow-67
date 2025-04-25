
import { getApiUrl } from '@/config/apiConfig';
import { validateApiResponse, isPhpContent } from '../validators/apiResponseValidator';

/**
 * Fonction utilitaire pour diagnostiquer l'API
 */
export const diagnoseApiConnection = async (): Promise<{
  success: boolean;
  details: any;
}> => {
  try {
    const API_URL = getApiUrl();
    const endpoint = `${API_URL}/user-profile-load.php`;
    const requestId = `diag_${new Date().getTime()}`;
    
    console.log(`🔍 DIAGNOSTIC - Connexion à: ${endpoint}`);
    
    const response = await fetch(`${endpoint}?test=1&requestId=${requestId}`, {
      method: 'GET',
      headers: {
        'X-Request-ID': requestId,
        'X-Client-Source': 'react-app-diagnostic'
      }
    });
    
    const responseText = await response.text();
    
    const diagnosticResult = {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type') || 'non spécifié',
      isPhp: isPhpContent(responseText),
      firstChars: responseText.substring(0, 50).replace(/\n/g, '\\n'),
      headers: Object.fromEntries(response.headers.entries())
    };
    
    if (diagnosticResult.isPhp) {
      return {
        success: false,
        details: {
          ...diagnosticResult,
          message: "PHP n'est pas correctement exécuté sur le serveur",
          tip: "Vérifiez la configuration PHP sur votre serveur."
        }
      };
    }
    
    try {
      const jsonResult = JSON.parse(responseText);
      return {
        success: jsonResult.php_check ? true : false,
        details: {
          ...diagnosticResult,
          jsonParsed: true,
          phpExecution: jsonResult.php_check ? true : false,
          response: jsonResult
        }
      };
    } catch (jsonError) {
      return {
        success: false,
        details: {
          ...diagnosticResult,
          jsonParsed: false,
          jsonError: (jsonError as Error).message,
          message: "La réponse n'est pas un JSON valide"
        }
      };
    }
  } catch (error) {
    console.error('❌ DIAGNOSTIC - Erreur:', error);
    return {
      success: false,
      details: {
        error: error instanceof Error ? error.message : "Erreur inconnue",
        message: "Impossible de contacter l'API"
      }
    };
  }
};

/**
 * Vérifie l'état du serveur PHP de manière détaillée
 */
export const checkPhpServerStatus = async (): Promise<{
  isWorking: boolean;
  detail: string;
  errorCode?: string;
}> => {
  try {
    const result = await diagnoseApiConnection();
    
    if (result.success) {
      return {
        isWorking: true,
        detail: "Le serveur PHP fonctionne correctement"
      };
    }
    
    if (result.details?.isPhp) {
      return {
        isWorking: false,
        detail: "Le serveur retourne le code PHP au lieu de l'exécuter",
        errorCode: "PHP_EXECUTION_ERROR"
      };
    }
    
    if (!result.details?.jsonParsed) {
      return {
        isWorking: false,
        detail: "Le serveur ne renvoie pas de JSON valide",
        errorCode: "INVALID_JSON"
      };
    }
    
    return {
      isWorking: false,
      detail: result.details?.message || "Problème de configuration du serveur",
      errorCode: "SERVER_CONFIG_ERROR"
    };
  } catch (error) {
    return {
      isWorking: false,
      detail: error instanceof Error ? error.message : "Erreur inconnue",
      errorCode: "CONNECTION_ERROR"
    };
  }
};
