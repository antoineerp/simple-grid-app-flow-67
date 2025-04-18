
import { logDebug } from './logger';
import { checkLovableScript, diagnoseNetworkIssues } from './diagnostics';
import { isLovableDemoMode } from './environment';

export function initializeApp(): void {
  logDebug("Initialisation de l'application");
  
  // Vérifier si nous sommes en mode démo ou en production
  const isDemoMode = isLovableDemoMode();
  logDebug(`Mode détecté: ${isDemoMode ? 'Démo Lovable' : 'Production'}`);
  
  // Vérifier le script Lovable et les problèmes réseau
  const lovableLoaded = checkLovableScript();
  const networkOk = diagnoseNetworkIssues();
  
  if (!lovableLoaded && isDemoMode) {
    console.error("AVERTISSEMENT: En mode démo mais la console Lovable n'est pas chargée correctement");
  }
  
  if (!networkOk) {
    console.error("AVERTISSEMENT: Des problèmes de réseau peuvent affecter les fonctionnalités");
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
