
/**
 * Utilitaire pour détecter l'environnement d'exécution
 */

/**
 * Vérifie si l'application est en mode démo Lovable
 */
export function isLovableDemo(): boolean {
  return typeof window.__LOVABLE_EDITOR__ !== 'undefined' && window.__LOVABLE_EDITOR__ !== null;
}

/**
 * Alias pour isLovableDemo pour une meilleure cohérence de nommage
 */
export function isLovableDemoMode(): boolean {
  return isLovableDemo();
}

/**
 * Détecte l'environnement actuel (production ou démo)
 */
export function getEnvironment(): 'production' | 'demo' {
  return isLovableDemo() ? 'demo' : 'production';
}

/**
 * Journalise des informations sur l'environnement actuel
 */
export function logEnvironmentInfo(): void {
  const env = getEnvironment();
  console.log(`Application en cours d'exécution en mode: ${env.toUpperCase()}`);
  
  if (env === 'demo') {
    console.log('Mode démo: fonctionnalités de test disponibles');
  } else {
    console.log('Mode production: fonctionnalités réduites pour la sécurité');
  }
}

/**
 * Vérifie si l'application est exécutée chez Infomaniak
 */
export function isInfomaniakEnvironment(): boolean {
  // Vérifier si le nom de domaine contient qualiopi.ch
  const hostname = window.location.hostname;
  return hostname.includes('qualiopi.ch');
}
