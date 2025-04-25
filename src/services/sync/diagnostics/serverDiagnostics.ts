
import { getApiUrl } from '@/config/apiConfig';
import { validateApiResponse } from '../validators/apiResponseValidator';
import { isPhpContent } from '../validators/apiResponseValidator';

/**
 * Check the PHP server status to verify if PHP is executing properly
 */
export const checkPhpServerStatus = async (): Promise<{
  isWorking: boolean;
  errorCode?: string;
  detail: string;
}> => {
  try {
    const API_URL = getApiUrl();
    const endpoint = `${API_URL}/phpinfo.php`;
    const requestId = `req_${new Date().getTime()}_${Math.random().toString(36).substring(2, 9)}`;
    
    console.log(`📡 Testing PHP execution at ${endpoint}`);
    
    const response = await fetch(`${endpoint}?_=${requestId}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store',
        'X-Request-ID': requestId,
      }
    });
    
    if (!response.ok) {
      return {
        isWorking: false,
        errorCode: 'HTTP_ERROR',
        detail: `HTTP error: ${response.status} ${response.statusText}`
      };
    }
    
    const responseText = await response.text();
    
    if (isPhpContent(responseText)) {
      return {
        isWorking: false,
        errorCode: 'PHP_EXECUTION_ERROR',
        detail: responseText.substring(0, 200) + '...'
      };
    }
    
    // Check if the response contains typical PHP info output indicators
    const isPHPInfoResponse = 
      responseText.includes('PHP Version') || 
      responseText.includes('PHP License') ||
      responseText.includes('PHP Configuration');
    
    if (isPHPInfoResponse) {
      return {
        isWorking: true,
        detail: 'PHP est correctement configuré et exécuté'
      };
    } else {
      return {
        isWorking: false,
        errorCode: 'UNEXPECTED_RESPONSE',
        detail: 'Réponse inattendue du serveur PHP'
      };
    }
    
  } catch (error) {
    console.error('Error testing PHP server:', error);
    return {
      isWorking: false,
      errorCode: 'CONNECTION_ERROR',
      detail: error instanceof Error ? error.message : 'Erreur inconnue lors du test PHP'
    };
  }
};

/**
 * Diagnose the API connection issues
 */
export const diagnoseApiConnection = async (): Promise<{
  success: boolean;
  issues: string[];
  details?: any;
}> => {
  try {
    const API_URL = getApiUrl();
    const endpoint = `${API_URL}/diagnose-connection.php`;
    const requestId = `req_${new Date().getTime()}_${Math.random().toString(36).substring(2, 9)}`;
    
    console.log(`🔧 Running API connection diagnostics`);
    
    const response = await fetch(`${endpoint}?requestId=${requestId}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store',
        'X-Request-ID': requestId,
      }
    });
    
    try {
      const result = await validateApiResponse(response);
      return {
        success: result.success === true,
        issues: result.issues || [],
        details: result.details || {}
      };
    } catch (error) {
      return {
        success: false,
        issues: [error instanceof Error ? error.message : 'Erreur de validation de la réponse API'],
        details: { error: 'validation_failed' }
      };
    }
    
  } catch (error) {
    console.error('Error diagnosing API connection:', error);
    return {
      success: false,
      issues: [error instanceof Error ? error.message : 'Erreur inconnue lors du diagnostic API'],
      details: { error: 'connection_failed' }
    };
  }
};
