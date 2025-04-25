
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
    
    // Tester le fichier php-execution-test.php
    const response = await fetch(`${getApiUrl()}/php-execution-test.php`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' }
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
    const endpoint = `${apiUrl}/php-execution-test.php`;
    
    console.log(`Diagnostic de connexion API: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' }
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
