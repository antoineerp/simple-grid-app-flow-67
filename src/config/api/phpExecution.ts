
import { getApiUrl } from './environment';

// Vérifier l'exécution PHP avec une approche plus robuste
export async function checkPhpExecution(): Promise<boolean> {
  try {
    // Essayer plusieurs fichiers PHP pour vérifier l'exécution
    const timestamp = Date.now();
    const testUrlOptions = [
      `${getApiUrl()}/php-simple-test.php?t=${timestamp}`,
      `${getApiUrl()}/test.php?t=${timestamp}`,
      `${getApiUrl()}/verify-php-execution.php?t=${timestamp}`,
      `${getApiUrl()}/infomaniak-check.php?t=${timestamp}`,
    ];
    
    console.log(`Vérification de l'exécution PHP sur plusieurs fichiers...`);

    // Essayer chaque URL jusqu'à ce qu'une fonctionne
    for (const testUrl of testUrlOptions) {
      try {
        console.log(`Essai avec: ${testUrl}`);
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          console.warn(`Échec sur ${testUrl}: ${response.status} ${response.statusText}`);
          continue;
        }

        const text = await response.text();
        
        // Vérifier si le contenu est du code PHP non exécuté
        if (text.trim().startsWith('<?php')) {
          console.error(`Code PHP non exécuté détecté sur ${testUrl}:`, text.substring(0, 100));
          continue;
        }
        
        try {
          // Essayer de parser comme JSON
          const json = JSON.parse(text);
          console.log(`Vérification PHP réussie avec ${testUrl}:`, json);
          return true;
        } catch (e) {
          console.warn(`Réponse non-JSON de ${testUrl}:`, text.substring(0, 150));
          continue;
        }
      } catch (error) {
        console.error(`Erreur lors de la vérification PHP avec ${testUrl}:`, error);
        continue;
      }
    }
    
    console.error('Toutes les vérifications PHP ont échoué');
    return false;
  } catch (error) {
    console.error('Erreur générale lors de la vérification PHP:', error);
    return false;
  }
}

// Test secondaire pour une configuration PHP de base
export async function testBasicPhp(): Promise<boolean> {
  try {
    // Essayer plusieurs fichiers PHP simples
    const testUrls = [
      `${getApiUrl()}/php-simple-test.php?t=${Date.now()}`,
      `${getApiUrl()}/test.php?t=${Date.now()}`
    ];
    
    for (const testUrl of testUrls) {
      try {
        const response = await fetch(testUrl);
        
        if (response.ok) {
          const text = await response.text();
          if (!text.includes('<?php') && (text.includes('PHP fonctionne') || text.includes('success'))) {
            console.log(`Test PHP basique réussi avec ${testUrl}`);
            return true;
          }
        }
      } catch (e) {
        console.warn(`Échec du test avec ${testUrl}:`, e);
      }
    }
    
    return false;
  } catch (error) {
    console.error('Test PHP basique échoué:', error);
    return false;
  }
}
