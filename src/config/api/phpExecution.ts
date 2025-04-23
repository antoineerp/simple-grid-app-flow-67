
import { getApiUrl } from './environment';

// Vérifier l'exécution PHP avec nouvelle approche plus fiable
export async function checkPhpExecution(): Promise<boolean> {
  try {
    // Permet une redirection transparente suivant la configuration (php-test.php ou verify-php-execution.php)
    const verifyUrl = `${getApiUrl()}/verify-php-execution.php`;
    console.log(`Vérification de l'exécution PHP:`, verifyUrl);

    const urlWithTimestamp = `${verifyUrl}?t=${Date.now()}`;

    const response = await fetch(urlWithTimestamp, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

    if (!response.ok) {
      console.error(`Échec de la vérification PHP: ${response.status} ${response.statusText}`);
      return false;
    }

    const text = await response.text();

    // "<php" => code non exécuté
    if (text.trim().startsWith('<?php')) {
      console.error('Code PHP non exécuté détecté lors de la vérification');
      return false;
    }

    console.log('Réponse de vérification PHP:', text);

    // "PHP fonctionne" ou tout autre mot-clé succès
    if (text.includes('PHP fonctionne')) {
      console.log('Vérification PHP réussie');
      return true;
    } else {
      console.warn('Réponse inattendue lors de la vérification PHP:', text);
      return false;
    }
  } catch (error) {
    console.error('Erreur lors de la vérification PHP:', error);
    return false;
  }
}
