
import { getApiUrl, getFullApiUrl } from './environment';
import { checkPhpExecution } from './phpExecution';

// Test amélioré de connexion à l'API avec vérification PHP préalable
export async function testApiConnection(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    const phpExecutionOk = await checkPhpExecution();

    if (!phpExecutionOk) {
      console.warn('Problème d\'exécution PHP détecté, vérifiez la configuration du serveur');
    }

    console.log(`Test de connexion à l'API:`, getFullApiUrl());

    const urlWithTimestamp = `${getApiUrl()}/index.php?t=${Date.now()}`;

    const response = await fetch(urlWithTimestamp, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

    console.log('Réponse du test API:', response.status, response.statusText);
    console.log('Headers:', response.headers);

    const responseText = await response.text();

    if (responseText.trim().startsWith('<?php')) {
      console.error('Code PHP non exécuté détecté dans la réponse');
      return {
        success: false,
        message: 'Le serveur renvoie le code PHP au lieu de l\'exécuter',
        details: {
          tip: 'Vérifiez la configuration du serveur pour exécuter les fichiers PHP. Vérifiez le fichier .htaccess et les permissions.'
        }
      };
    }
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      console.warn('Réponse HTML reçue au lieu de JSON');
      return {
        success: false,
        message: 'Le serveur a renvoyé du HTML au lieu de JSON',
        details: {
          tip: 'Vérifiez que le script PHP génère correctement du JSON avec les bons headers.'
        }
      };
    }
    try {
      const data = JSON.parse(responseText);
      return {
        success: true,
        message: data.message || 'API connectée',
        details: data
      };
    } catch (e) {
      return {
        success: false,
        message: 'Réponse non-JSON reçue de l\'API',
        details: {
          error: e instanceof Error ? e.message : String(e),
          responseText: responseText.substring(0, 300)
        }
      };
    }
  } catch (error) {
    console.error('Erreur lors du test API:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      details: { error }
    };
  }
}
