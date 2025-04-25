
import { getApiUrl, fetchWithErrorHandling } from '@/config/apiConfig';

export interface ServerDiagnosticResult {
  status: 'success' | 'error';
  message: string;
  details?: Record<string, any>;
  php_version?: string;
  timestamp?: string;
}

/**
 * Teste l'exécution PHP de base
 */
export const testPhpExecution = async (): Promise<ServerDiagnosticResult> => {
  try {
    const url = `${getApiUrl()}/php-execution-test.php`;
    console.log(`Exécution du test PHP: ${url}`);
    
    const response = await fetchWithErrorHandling(url);
    return {
      status: 'success',
      message: response.message || 'PHP fonctionne correctement',
      php_version: response.php_version,
      timestamp: response.timestamp,
      details: response
    };
  } catch (error) {
    console.error("Erreur lors du test d'exécution PHP:", error);
    return {
      status: 'error',
      message: error instanceof Error 
        ? `Erreur lors du test PHP: ${error.message}` 
        : 'Erreur inconnue lors du test PHP',
      details: { error }
    };
  }
};

/**
 * Exécute un diagnostic complet du serveur
 */
export const runFullServerDiagnostic = async (): Promise<Record<string, any>> => {
  try {
    const url = `${getApiUrl()}/php-system-check.php`;
    console.log(`Exécution du diagnostic complet: ${url}`);
    
    const response = await fetchWithErrorHandling(url);
    return response;
  } catch (error) {
    console.error("Erreur lors du diagnostic complet:", error);
    throw error;
  }
};

/**
 * Teste un endpoint API spécifique
 */
export const testApiEndpoint = async (endpoint: string): Promise<ServerDiagnosticResult> => {
  try {
    const url = `${getApiUrl()}/${endpoint}`;
    console.log(`Test de l'endpoint API: ${url}`);
    
    const startTime = performance.now();
    const response = await fetchWithErrorHandling(url);
    const endTime = performance.now();
    
    return {
      status: 'success',
      message: `Endpoint ${endpoint} répond correctement en ${(endTime - startTime).toFixed(2)}ms`,
      details: {
        response,
        timing: {
          duration: endTime - startTime,
          unit: 'ms'
        }
      }
    };
  } catch (error) {
    console.error(`Erreur lors du test de l'endpoint ${endpoint}:`, error);
    return {
      status: 'error',
      message: error instanceof Error 
        ? `Erreur avec l'endpoint ${endpoint}: ${error.message}` 
        : `Erreur inconnue avec l'endpoint ${endpoint}`,
      details: { error }
    };
  }
};

/**
 * Teste le chargement d'un fichier statique
 */
export const testAssetLoading = async (assetPath: string): Promise<ServerDiagnosticResult> => {
  try {
    const fullPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
    console.log(`Test du chargement de l'asset: ${fullPath}`);
    
    const startTime = performance.now();
    const response = await fetch(fullPath);
    const endTime = performance.now();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return {
      status: 'success',
      message: `Asset ${assetPath} chargé correctement en ${(endTime - startTime).toFixed(2)}ms`,
      details: {
        path: fullPath,
        status: response.status,
        contentType: response.headers.get('content-type'),
        timing: {
          duration: endTime - startTime,
          unit: 'ms'
        }
      }
    };
  } catch (error) {
    console.error(`Erreur lors du chargement de l'asset ${assetPath}:`, error);
    return {
      status: 'error',
      message: error instanceof Error 
        ? `Erreur avec l'asset ${assetPath}: ${error.message}` 
        : `Erreur inconnue avec l'asset ${assetPath}`,
      details: { error }
    };
  }
};

/**
 * Teste la connexion à la base de données
 */
export const testDatabaseConnection = async (): Promise<ServerDiagnosticResult> => {
  try {
    const url = `${getApiUrl()}/db-connection-test.php`;
    console.log(`Test de connexion à la base de données: ${url}`);
    
    const response = await fetchWithErrorHandling(url);
    
    if (response.status === 'success') {
      return {
        status: 'success',
        message: 'Connexion à la base de données réussie',
        details: response
      };
    } else {
      return {
        status: 'error',
        message: response.message || 'Échec de la connexion à la base de données',
        details: response
      };
    }
  } catch (error) {
    console.error("Erreur lors du test de connexion à la base de données:", error);
    return {
      status: 'error',
      message: error instanceof Error 
        ? `Erreur de connexion à la base de données: ${error.message}` 
        : 'Erreur inconnue lors de la connexion à la base de données',
      details: { error }
    };
  }
};
