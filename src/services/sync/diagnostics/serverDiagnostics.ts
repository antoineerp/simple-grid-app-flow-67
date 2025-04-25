
import { getApiUrl } from '@/config/apiConfig';
import { getAuthHeaders } from '@/services/auth/authService';
import { validateApiResponse } from '../validators/apiResponseValidator';

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

