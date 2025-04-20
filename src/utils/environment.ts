
/**
 * Utilitaire pour détecter l'environnement d'exécution
 */

/**
 * Types d'environnement supportés
 */
export type EnvironmentType = 'demo' | 'production' | 'infomaniak';

/**
 * Vérifie si l'application est en mode démo Lovable
 */
export function isLovableDemo(): boolean {
  // Vérifier à la fois la présence de l'objet __LOVABLE_EDITOR__ et le domaine
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
  // Vérifier si le nom de domaine contient qualiopi.ch
  const hostname = window.location.hostname;
  return hostname.includes('qualiopi.ch');
}

/**
 * Obtient l'environnement actuel avec un type plus précis
 */
export function getEnvironmentType(): EnvironmentType {
  if (isLovableDemo()) {
    return 'demo';
  } else if (isInfomaniakEnvironment()) {
    return 'infomaniak';
  } else {
    return 'production';
  }
}

/**
 * Obtient l'environnement actuel en format lisible
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
 * Alias pour isLovableDemo pour une meilleure cohérence de nommage
 * @deprecated Utiliser isLovableDemo() à la place
 */
export function isLovableDemoMode(): boolean {
  return isLovableDemo();
}

/**
 * Détecte l'environnement actuel (production ou démo)
 * @deprecated Utiliser getEnvironmentType() à la place
 */
export function getEnvironment(): 'production' | 'demo' {
  return isLovableDemo() ? 'demo' : 'production';
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
  
  if (envType === 'demo') {
    console.log('Mode démo: fonctionnalités de test disponibles');
  } else {
    console.log('Mode production: fonctionnalités optimisées pour la performance et la sécurité');
  }
}
