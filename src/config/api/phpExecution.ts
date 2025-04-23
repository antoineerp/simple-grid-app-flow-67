
import { getApiUrl } from './environment';

// Vérifier l'exécution PHP avec une approche plus robuste pour Infomaniak
export async function checkPhpExecution(): Promise<boolean> {
  try {
    // Essayer plusieurs fichiers PHP pour vérifier l'exécution
    const timestamp = Date.now();
    const testUrl = `${getApiUrl()}/test.php?t=${timestamp}`;
    
    console.log(`Vérification de l'exécution PHP sur: ${testUrl}`);

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    if (!response.ok) {
      console.warn(`Test PHP échoué: ${response.status} ${response.statusText}`);
      return false;
    }

    const text = await response.text();
    
    // Vérifier si le contenu est du code PHP non exécuté
    if (text.trim().startsWith('<?php')) {
      console.error(`Code PHP non exécuté détecté:`, text.substring(0, 100));
      return false;
    }
    
    try {
      // Essayer de parser comme JSON
      const json = JSON.parse(text);
      console.log(`Vérification PHP réussie:`, json);
      return true;
    } catch (e) {
      console.warn(`Réponse non-JSON:`, text.substring(0, 150));
      return false;
    }
  } catch (error) {
    console.error('Erreur lors de la vérification PHP:', error);
    return false;
  }
}

// Test secondaire pour une configuration PHP de base
export async function testBasicPhp(): Promise<boolean> {
  try {
    // Test minimal avec un fichier PHP très simple
    const testUrl = `${getApiUrl()}/test.php?t=${Date.now()}`;
    const response = await fetch(testUrl);
    
    if (response.ok) {
      const text = await response.text();
      return !text.includes('<?php') && (text.includes('PHP fonctionne') || text.includes('success'));
    }
    
    return false;
  } catch (error) {
    console.error('Test PHP basique échoué:', error);
    return false;
  }
}
