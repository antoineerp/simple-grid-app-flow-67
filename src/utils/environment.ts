
/**
 * Types d'environnement supportés
 */
export type EnvironmentType = 'demo' | 'production' | 'infomaniak';

/**
 * Vérifie si l'application est en mode démo Lovable
 */
export function isLovableDemo(): boolean {
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
  if (isLovableDemo()) {
    return 'demo';
  } else if (isInfomaniakEnvironment()) {
    return 'infomaniak';
  }
  return 'production';
}

/**
 * Obtient le nom de l'environnement en format lisible
 */
export function getEnvironmentName(): string {
  const env = getEnvironmentType();
  switch (env) {
    case 'demo':
      return 'Démo Lovable';
    case 'infomaniak':
      return 'Production Infomaniak';
    case 'production':
      return 'Production Standard';
  }
}

/**
 * Journalise des informations détaillées sur l'environnement actuel
 */
export function logEnvironmentInfo(): void {
  const envType = getEnvironmentType();
  const envName = getEnvironmentName();
  
  console.log(`===== INFORMATIONS D'ENVIRONNEMENT =====`);
  console.log(`Type d'environnement: ${envType}`);
  console.log(`Nom de l'environnement: ${envName}`);
  console.log(`Domaine: ${window.location.hostname}`);
  console.log(`Lovable détecté: ${isLovableDemo() ? 'Oui' : 'Non'}`);
  console.log(`Infomaniak détecté: ${isInfomaniakEnvironment() ? 'Oui' : 'Non'}`);
  console.log(`=======================================`);
}
