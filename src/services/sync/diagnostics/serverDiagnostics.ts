
import { getApiUrl, fetchWithErrorHandling } from '@/config/apiConfig';

/**
 * Fonction pour vérifier l'état du serveur PHP
 */
export const diagnoseApiConnection = async (): Promise<{
  isConnected: boolean;
  message: string;
  details?: any;
}> => {
  try {
    const API_URL = getApiUrl();
    console.log(`Diagnostic de connexion à l'API: ${API_URL}`);
    
    const response = await fetch(`${API_URL}/index.php?test=1`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    // Vérifier d'abord si la réponse est OK
    if (!response.ok) {
      return {
        isConnected: false,
        message: `Erreur HTTP: ${response.status} ${response.statusText}`
      };
    }
    
    // Récupérer le contenu de la réponse
    const responseText = await response.text();
    
    // Vérifier si la réponse est du PHP non interprété
    if (responseText.trim().startsWith('<?php')) {
      return {
        isConnected: false,
        message: 'PHP n\'est pas exécuté par le serveur',
        details: {
          error: 'PHP execution error',
          hint: 'Le serveur renvoie le code PHP au lieu de l\'exécuter'
        }
      };
    }
    
    // Essayer de parser le JSON
    try {
      const data = JSON.parse(responseText);
      return {
        isConnected: true,
        message: data.message || 'Connexion réussie',
        details: data
      };
    } catch (e) {
      // Si ce n'est pas du JSON valide
      return {
        isConnected: false,
        message: 'Réponse invalide (pas du JSON)',
        details: {
          responseText: responseText.substring(0, 200) + '...'
        }
      };
    }
  } catch (error) {
    return {
      isConnected: false,
      message: `Erreur lors du diagnostic: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Fonction spécifique pour vérifier l'exécution de PHP
 */
export const checkPhpServerStatus = async (): Promise<{
  isWorking: boolean;
  detail: string;
  errorCode?: string;
}> => {
  try {
    const API_URL = getApiUrl();
    const testUrl = `${API_URL}/php-execution-test.php`;
    console.log(`Test d'exécution PHP: ${testUrl}`);

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

    // Récupérer le contenu de la réponse
    const responseText = await response.text();
    
    // Vérifier si le PHP est correctement exécuté
    if (responseText.includes('<?php') || responseText.startsWith('<?php')) {
      console.error('Le code PHP n\'est pas exécuté:', responseText.substring(0, 200));
      return {
        isWorking: false,
        detail: 'Le serveur renvoie le code PHP au lieu de l\'exécuter',
        errorCode: 'PHP_EXECUTION_ERROR'
      };
    }
    
    // Essayer de parser la réponse comme JSON
    try {
      const data = JSON.parse(responseText);
      if (data.success && data.php_version) {
        return {
          isWorking: true,
          detail: `PHP ${data.php_version} fonctionne correctement`
        };
      } else {
        return {
          isWorking: false,
          detail: data.message || 'Réponse PHP invalide',
          errorCode: 'PHP_INVALID_RESPONSE'
        };
      }
    } catch (e) {
      // Vérifier si la réponse ressemble à du HTML
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
        return {
          isWorking: false,
          detail: 'Le serveur renvoie du HTML au lieu du JSON attendu',
          errorCode: 'PHP_HTML_RESPONSE'
        };
      }
      
      return {
        isWorking: false,
        detail: 'Impossible de parser la réponse JSON',
        errorCode: 'PHP_PARSE_ERROR'
      };
    }
  } catch (error) {
    return {
      isWorking: false,
      detail: `Erreur lors du test PHP: ${error instanceof Error ? error.message : String(error)}`,
      errorCode: 'PHP_CONNECTION_ERROR'
    };
  }
};

/**
 * Fonction utilitaire pour valider les réponses de l'API
 */
export const validateApiResponse = async (response: Response): Promise<any> => {
  try {
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }
    
    const responseText = await response.text();
    
    // Vérifier si la réponse est du PHP non interprété
    if (responseText.trim().startsWith('<?php')) {
      throw new Error('PHP n\'est pas exécuté par le serveur');
    }
    
    // Vérifier si la réponse est vide
    if (!responseText.trim()) {
      return { success: true, message: 'Opération réussie (réponse vide)' };
    }
    
    // Essayer de parser le JSON
    try {
      return JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Impossible de parser le JSON: ${e instanceof Error ? e.message : String(e)}`);
    }
  } catch (error) {
    console.error('Erreur lors de la validation de la réponse API:', error);
    throw error;
  }
};
