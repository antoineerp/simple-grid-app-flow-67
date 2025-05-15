
import { getApiUrl } from '@/config/apiConfig';
import { validateJsonResponse } from '@/utils/jsonValidator';

export interface ApiDiagnosticResult {
  success: boolean;
  message: string;
  details?: {
    phpWorking: boolean;
    envFileStatus: 'missing' | 'created' | 'ok';
    serverSoftware?: string;
    phpVersion?: string;
    error?: string;
    tip?: string;
    rawResponse?: string;
  };
}

/**
 * Effectue un diagnostic complet de la connexion API
 * @returns Résultat du diagnostic avec détails
 */
export const runApiDiagnostic = async (): Promise<ApiDiagnosticResult> => {
  try {
    const API_URL = getApiUrl();
    console.log(`Exécution du diagnostic API: ${API_URL}/check-php-execution.php`);
    
    const response = await fetch(`${API_URL}/check-php-execution.php`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    const responseText = await response.text();
    console.log("Réponse brute:", responseText.substring(0, 300));
    
    // Vérifier si la réponse contient du code PHP brut
    if (responseText.trim().startsWith('<?php')) {
      return {
        success: false,
        message: "Le serveur renvoie du code PHP au lieu de l'exécuter",
        details: {
          phpWorking: false,
          envFileStatus: 'missing',
          error: "Configuration PHP incorrecte sur le serveur",
          tip: "Vérifiez que PHP est correctement installé et configuré sur votre serveur",
          rawResponse: responseText.substring(0, 100) + '...'
        }
      };
    }
    
    // Vérifier si la réponse est du HTML (erreur 404, 500, etc.)
    if (responseText.trim().toLowerCase().startsWith('<!doctype') || 
        responseText.trim().toLowerCase().startsWith('<html')) {
      return {
        success: false,
        message: "Le serveur a renvoyé une page HTML au lieu de JSON",
        details: {
          phpWorking: false,
          envFileStatus: 'missing',
          error: "Erreur de configuration du serveur ou fichier introuvable",
          tip: "Vérifiez que le fichier PHP existe et est accessible",
          rawResponse: responseText.substring(0, 100) + '...'
        }
      };
    }
    
    // Analyser la réponse JSON
    const validationResult = validateJsonResponse(responseText);
    
    if (!validationResult.isValid) {
      return {
        success: false,
        message: validationResult.error || "Format de réponse invalide",
        details: {
          phpWorking: false,
          envFileStatus: 'missing',
          error: "Impossible de parser la réponse comme du JSON valide",
          rawResponse: responseText.substring(0, 100) + '...'
        }
      };
    }
    
    const data = validationResult.data;
    
    if (!data.success) {
      return {
        success: false,
        message: "Le diagnostic a échoué",
        details: {
          phpWorking: data.php_working || false,
          envFileStatus: data.env_status?.exists ? 'ok' : 'missing',
          serverSoftware: data.server_software,
          phpVersion: data.php_version,
          error: data.message || "Erreur non spécifiée"
        }
      };
    }
    
    return {
      success: true,
      message: data.env_status?.created 
        ? "Le fichier env.php a été créé automatiquement" 
        : "La connexion à l'API fonctionne correctement",
      details: {
        phpWorking: true,
        envFileStatus: data.env_status?.created ? 'created' : 'ok',
        serverSoftware: data.server_software,
        phpVersion: data.php_version
      }
    };
    
  } catch (error) {
    console.error("Erreur lors du diagnostic API:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur inconnue lors du diagnostic",
      details: {
        phpWorking: false,
        envFileStatus: 'missing',
        error: error instanceof Error ? error.message : "Erreur inconnue"
      }
    };
  }
};

/**
 * Répare le fichier env.php manquant
 */
export const fixEnvPhpFile = async (): Promise<ApiDiagnosticResult> => {
  try {
    const API_URL = getApiUrl();
    console.log(`Tentative de réparation du fichier env.php: ${API_URL}/fix-env.php`);
    
    const response = await fetch(`${API_URL}/fix-env.php`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    const responseText = await response.text();
    console.log("Réponse de réparation:", responseText.substring(0, 300));
    
    // Exécuter un nouveau diagnostic après la tentative de réparation
    return await runApiDiagnostic();
  } catch (error) {
    console.error("Erreur lors de la réparation de env.php:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur inconnue lors de la réparation",
      details: {
        phpWorking: false,
        envFileStatus: 'missing',
        error: error instanceof Error ? error.message : "Erreur inconnue"
      }
    };
  }
};
