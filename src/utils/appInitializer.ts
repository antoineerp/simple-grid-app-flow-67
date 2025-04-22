
import { logDebug } from './logger';
import { checkLovableScript, diagnoseNetworkIssues } from './diagnostics';
import { isLovableDemo, getEnvironmentType, isInfomaniakEnvironment } from './environment';

export function initializeApp(): void {
  logDebug("Initialisation de l'application");
  
  // Vérifier l'environnement actuel
  const envType = getEnvironmentType();
  logDebug(`Environnement détecté: ${envType}`);
  
  // Vérifications conditionnelles selon l'environnement
  if (envType === 'demo') {
    // En mode démo, vérifier spécifiquement les ressources Lovable
    const lovableLoaded = checkLovableScript();
    
    if (!lovableLoaded) {
      console.error("AVERTISSEMENT: En mode démo mais la console Lovable n'est pas chargée correctement");
    }
  }
  
  // Vérifications communes à tous les environnements
  const networkOk = diagnoseNetworkIssues();
  
  if (!networkOk) {
    console.error("AVERTISSEMENT: Des problèmes de réseau peuvent affecter les fonctionnalités");
  }
  
  // Configuration spécifique à l'environnement
  switch (envType) {
    case 'demo':
      logDebug("Configuration spécifique au mode démo activée");
      break;
    case 'infomaniak':
      logDebug("Configuration spécifique à Infomaniak activée");
      break;
    case 'production':
      logDebug("Configuration de production standard activée");
      break;
  }
}

export function handleInitError(error: Error, rootElement: HTMLElement | null): void {
  logDebug("Erreur lors du rendu de l'application", error);
  
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
        <h1>Erreur de chargement</h1>
        <p>L'application n'a pas pu être chargée correctement.</p>
        <p>Erreur: ${error.message}</p>
        <button onclick="window.location.reload()" style="padding:10px 20px; margin-top:20px; cursor:pointer;">
          Réessayer
        </button>
      </div>
    `;
  }
}
