
import { getApiUrl } from '@/config/apiConfig';

/**
 * Fonction pour tester si le serveur PHP exécute correctement PHP
 */
export async function checkPhpServerStatus(): Promise<{
  isWorking: boolean;
  errorCode?: string;
  detail?: string;
}> {
  try {
    console.log("Vérification du statut du serveur PHP...");
    
    // Tester le fichier php-execution-test.php avec un timestamp pour éviter la mise en cache
    const timestamp = new Date().getTime();
    const response = await fetch(`${getApiUrl()}/php-execution-test.php?t=${timestamp}`, {
      method: 'GET',
      headers: { 
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    // Si le status n'est pas 200, c'est une erreur
    if (!response.ok) {
      return {
        isWorking: false,
        errorCode: 'HTTP_ERROR',
        detail: `Erreur HTTP ${response.status}: ${response.statusText}`
      };
    }
    
    // Récupérer le texte de la réponse
    const text = await response.text();
    
    // Vérifier si le texte commence par "<?php" (indiquant que PHP n'est pas exécuté)
    if (text.trim().startsWith('<?php')) {
      return {
        isWorking: false,
        errorCode: 'PHP_EXECUTION_ERROR',
        detail: "Le serveur renvoie le code PHP au lieu de l'exécuter"
      };
    }
    
    // Vérifier si c'est du JSON valide (ce qui serait attendu)
    try {
      const jsonData = JSON.parse(text);
      
      // Vérifier si les données contiennent les informations attendues
      if (jsonData.success === true && jsonData.php_version) {
        return {
          isWorking: true,
          detail: `PHP version ${jsonData.php_version} fonctionne correctement`
        };
      }
    } catch (e) {
      // Ce n'est pas du JSON valide
      return {
        isWorking: false,
        errorCode: 'INVALID_JSON',
        detail: `La réponse n'est pas du JSON valide: ${text.substring(0, 100)}...`
      };
    }
    
    // Par défaut, on suppose que ça ne fonctionne pas correctement
    return {
      isWorking: false,
      errorCode: 'UNEXPECTED_RESPONSE',
      detail: `Réponse inattendue: ${text.substring(0, 100)}...`
    };
    
  } catch (error) {
    return {
      isWorking: false,
      errorCode: 'CONNECTION_ERROR',
      detail: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Fonction pour diagnostiquer les problèmes de connexion API
 */
export async function diagnoseApiConnection(): Promise<{
  success: boolean;
  diagnostics: {
    apiEndpoint: string;
    status: number | null;
    responseType: string | null;
    isPhpExecuted: boolean | null;
    error?: string;
  };
}> {
  try {
    const apiUrl = getApiUrl();
    const timestamp = new Date().getTime();
    const endpoint = `${apiUrl}/php-execution-test.php?t=${timestamp}`;
    
    console.log(`Diagnostic de connexion API: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    
    // Vérifier si le PHP est correctement exécuté
    const isPhpExecuted = !text.trim().startsWith('<?php');
    
    return {
      success: response.ok && isPhpExecuted,
      diagnostics: {
        apiEndpoint: endpoint,
        status: response.status,
        responseType: contentType,
        isPhpExecuted,
        error: !response.ok ? `HTTP ${response.status}: ${response.statusText}` : 
               !isPhpExecuted ? "Le PHP n'est pas exécuté correctement" : undefined
      }
    };
  } catch (error) {
    return {
      success: false,
      diagnostics: {
        apiEndpoint: `${getApiUrl()}/php-execution-test.php`,
        status: null,
        responseType: null,
        isPhpExecuted: null,
        error: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

/**
 * Test complet de tous les composants de l'API
 */
export async function fullApiDiagnostic(): Promise<{
  status: 'success' | 'error' | 'partial';
  tests: Array<{
    name: string;
    url: string;
    status: 'success' | 'error';
    detail: string;
  }>;
}> {
  const apiUrl = getApiUrl();
  const timestamp = new Date().getTime();
  
  const endpoints = [
    { name: 'API Info', url: `${apiUrl}/index.php?test=1&t=${timestamp}` },
    { name: 'PHP Execution Test', url: `${apiUrl}/php-execution-test.php?t=${timestamp}` },
    { name: 'PHP Info', url: `${apiUrl}/info.php?t=${timestamp}` },
    { name: 'System Check', url: `${apiUrl}/system-check.php?t=${timestamp}` }
  ];
  
  const results = [];
  let successCount = 0;
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing endpoint: ${endpoint.url}`);
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: { 
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0' 
        }
      });
      
      const text = await response.text();
      const isPhpExecuted = !text.trim().startsWith('<?php');
      
      if (response.ok && isPhpExecuted) {
        successCount++;
        results.push({
          name: endpoint.name,
          url: endpoint.url,
          status: 'success',
          detail: `Status code: ${response.status} ${response.statusText}`
        });
      } else {
        results.push({
          name: endpoint.name,
          url: endpoint.url,
          status: 'error',
          detail: isPhpExecuted 
            ? `HTTP error: ${response.status} ${response.statusText}` 
            : 'Le PHP n\'est pas exécuté correctement'
        });
      }
    } catch (error) {
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: 'error',
        detail: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  return {
    status: successCount === endpoints.length ? 'success' : successCount > 0 ? 'partial' : 'error',
    tests: results
  };
}
