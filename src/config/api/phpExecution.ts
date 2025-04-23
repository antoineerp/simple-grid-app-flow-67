
import { getApiUrl } from './environment';

// Vérifier l'exécution PHP avec une approche plus robuste pour Infomaniak
export async function checkPhpExecution(): Promise<boolean> {
  try {
    // Essayer plusieurs fichiers PHP pour vérifier l'exécution
    const verifyUrl = `${getApiUrl()}/verify-php-execution.php`;
    const infoUrl = `${getApiUrl()}/infomaniak-check.php`;
    const testUrl = `${getApiUrl()}/test.php`;
    
    console.log(`Vérification de l'exécution PHP (URLs multiples pour redondance):`);
    console.log(`- Principal: ${verifyUrl}`);
    console.log(`- Infomaniak: ${infoUrl}`);
    console.log(`- Test: ${testUrl}`);

    // Ajouter un timestamp pour éviter le cache
    const timestamp = Date.now();
    const urls = [
      `${verifyUrl}?t=${timestamp}`,
      `${infoUrl}?t=${timestamp}`,
      `${testUrl}?t=${timestamp}`
    ];
    
    // Essayer chaque URL jusqu'à ce qu'une fonctionne
    for (const url of urls) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
        
        if (!response.ok) {
          console.warn(`URL ${url} a échoué: ${response.status} ${response.statusText}`);
          continue;
        }

        const text = await response.text();
        
        // Vérifier si le contenu est du code PHP non exécuté
        if (text.trim().startsWith('<?php')) {
          console.error(`Code PHP non exécuté détecté sur ${url}`);
          continue;
        }
        
        try {
          // Essayer de parser comme JSON
          const json = JSON.parse(text);
          console.log(`Vérification PHP réussie sur ${url}:`, json);
          return true;
        } catch (e) {
          console.warn(`Réponse non-JSON de ${url}:`, text.substring(0, 150));
        }
      } catch (err) {
        console.warn(`Erreur lors de l'accès à ${url}:`, err);
      }
    }
    
    // Si aucune URL n'a fonctionné
    console.error("Toutes les vérifications PHP ont échoué");
    return false;
  } catch (error) {
    console.error('Erreur globale lors de la vérification PHP:', error);
    return false;
  }
}

// Test secondaire pour une configuration PHP de base
export async function testBasicPhp(): Promise<boolean> {
  try {
    // Test minimal
    const testUrl = `${getApiUrl()}/test-500.php?t=${Date.now()}`;
    const response = await fetch(testUrl);
    
    if (response.ok) {
      const text = await response.text();
      return text.includes('PHP fonctionne');
    }
    
    return false;
  } catch (error) {
    console.error('Test PHP basique échoué:', error);
    return false;
  }
}
