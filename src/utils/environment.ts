
/**
 * Types d'environnement supportés
 */
export type EnvironmentType = 'demo' | 'production' | 'infomaniak';

/**
 * Vérifie si l'application est en mode démo Lovable
 */
export function isLovableDemo(): boolean {
  // En production sur Infomaniak, toujours retourner false
  if (isInfomaniakEnvironment()) {
    return false;
  }
  
  return (
    (typeof window.__LOVABLE_EDITOR__ !== 'undefined' && window.__LOVABLE_EDITOR__ !== null) ||
    isLovableDomain()
  );
}

/**
 * Vérifie si le domaine est un domaine Lovable
 */
export function isLovableDomain(): boolean {
  const hostname = window.location.hostname;
  return (
    hostname.includes('lovable.dev') ||
    hostname.includes('lovable.app') ||
    hostname.includes('gpteng.co')
  );
}

/**
 * Vérifie si l'application est exécutée chez Infomaniak
 */
export function isInfomaniakEnvironment(): boolean {
  const hostname = window.location.hostname;
  return hostname.includes('qualiopi.ch');
}

/**
 * Obtient l'environnement actuel
 */
export function getEnvironmentType(): EnvironmentType {
  if (isInfomaniakEnvironment()) {
    return 'infomaniak';
  } else if (isLovableDemo()) {
    return 'demo';
  }
  return 'production';
}

/**
 * Journalise des informations détaillées sur l'environnement actuel
 */
export function logEnvironmentInfo(): void {
  const envType = getEnvironmentType();
  const hostname = window.location.hostname;
  
  console.log(`===== INFORMATIONS D'ENVIRONNEMENT =====`);
  console.log(`Type d'environnement: ${envType}`);
  console.log(`Nom de domaine: ${hostname}`);
  console.log(`Infomaniak: ${isInfomaniakEnvironment() ? 'Oui' : 'Non'}`);
  console.log(`Lovable Demo: ${isLovableDemo() ? 'Oui' : 'Non'}`);
  console.log(`=======================================`);
}

