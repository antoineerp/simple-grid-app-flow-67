
import { logDebug } from './logger';

export function checkLovableScript(): boolean {
  const lovableScript = document.querySelector('script[src*="gptengineer.js"]');
  if (!lovableScript) {
    console.error("ERREUR CRITIQUE: Le script Lovable n'a pas été trouvé dans le DOM!");
    return false;
  }
  
  console.log("Script Lovable trouvé:", lovableScript);
  
  const mainScript = document.querySelector('script[src*="main"]');
  if (mainScript && lovableScript.compareDocumentPosition(mainScript) & Node.DOCUMENT_POSITION_FOLLOWING) {
    console.log("L'ordre des scripts est correct: Lovable chargé avant le script principal");
    return true;
  } else {
    console.error("ERREUR: Le script Lovable doit être chargé AVANT le script principal");
    return false;
  }
}

export function diagnoseNetworkIssues(): boolean {
  if (!navigator.onLine) {
    console.error("ERREUR: Pas de connexion Internet détectée");
    return false;
  }
  
  fetch('https://cdn.gpteng.co/ping', { 
    mode: 'no-cors', 
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache'
    }
  })
  .then(() => {
    console.log("Connexion à cdn.gpteng.co réussie");
  })
  .catch(error => {
    console.error("Erreur de connexion à cdn.gpteng.co:", error);
  });
  
  return true;
}
