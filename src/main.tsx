
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Define window properties for TypeScript
declare global {
  interface Window {
    __LOVABLE_EDITOR__: any;
    __diagnoseLovable: () => void;
    testPhp: () => void;
  }
}

// Initialize global properties if they don't exist
window.__LOVABLE_EDITOR__ = window.__LOVABLE_EDITOR__ || null;
window.__diagnoseLovable = window.__diagnoseLovable || function() {
  console.log("=== DIAGNOSTIC LOVABLE ===");
  checkLovableScript();
  diagnoseNetworkIssues();
  
  // Vérifier les bloqueurs potentiels
  console.log("Test de connexion aux CDN:");
  
  const cdns = [
    'https://cdn.gpteng.co/ping',
    'https://fonts.googleapis.com/favicon.ico',
    'https://www.gstatic.com/favicon.ico'
  ];
  
  cdns.forEach(url => {
    fetch(url, { mode: 'no-cors', cache: 'no-store' })
      .then(() => console.log(`✅ Connexion réussie à ${url}`))
      .catch(err => console.error(`❌ Échec de connexion à ${url}:`, err));
  });
  
  console.log("Vérification de la console Lovable:");
  console.log("__LOVABLE_EDITOR__ présent:", typeof window.__LOVABLE_EDITOR__ !== 'undefined');
  
  console.log("=== FIN DU DIAGNOSTIC ===");
  console.log("Pour résoudre les problèmes, essayez:");
  console.log("1. Désactiver les bloqueurs de publicités/scripts");
  console.log("2. Vider le cache du navigateur");
  console.log("3. Essayer un autre navigateur (Chrome recommandé)");
  console.log("4. Vérifier votre connexion réseau (VPN, pare-feu)");
};

// Fonction de journalisation améliorée
function logDebug(message: string, error?: Error) {
  console.log(`[FormaCert Debug] ${message}`);
  if (error) {
    console.error(`[FormaCert Error]`, error);
  }
}

// Vérifier que le script Lovable est bien chargé
function checkLovableScript(): boolean {
  const lovableScript = document.querySelector('script[src*="gptengineer.js"]');
  if (!lovableScript) {
    console.error("ERREUR CRITIQUE: Le script Lovable n'a pas été trouvé dans le DOM!");
    return false;
  }
  
  console.log("Script Lovable trouvé:", lovableScript);
  
  // Vérifier si le script est avant le script principal
  const mainScript = document.querySelector('script[src*="main"]');
  if (mainScript && lovableScript.compareDocumentPosition(mainScript) & Node.DOCUMENT_POSITION_FOLLOWING) {
    console.log("L'ordre des scripts est correct: Lovable chargé avant le script principal");
    return true;
  } else {
    console.error("ERREUR: Le script Lovable doit être chargé AVANT le script principal");
    return false;
  }
}

// Diagnostiquer les problèmes de réseau
function diagnoseNetworkIssues(): boolean {
  // Vérifier si le navigateur est connecté à Internet
  if (!navigator.onLine) {
    console.error("ERREUR: Pas de connexion Internet détectée");
    return false;
  }
  
  // Vérifier l'accès à cdn.gpteng.co
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

// Détecter le mode
function isLovableDemoMode(): boolean {
  return typeof window.__LOVABLE_EDITOR__ !== 'undefined' && window.__LOVABLE_EDITOR__ !== null;
}

// Initialiser l'application
function initializeApp(): void {
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
  
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    logDebug("Élément racine introuvable", new Error("Root element not found"));
    return;
  }
  
  try {
    logDebug("Création du root React");
    const root = createRoot(rootElement);
    
    logDebug("Rendu de l'application React");
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    logDebug("Application rendue avec succès");
    console.log(`==== APPLICATION CHARGÉE AVEC SUCCÈS EN MODE ${isDemoMode ? 'DÉMO' : 'PRODUCTION'} ====`);
    
    // Vérification supplémentaire pour la console Lovable en mode démo
    if (isDemoMode) {
      setTimeout(() => {
        if (typeof window.__LOVABLE_EDITOR__ === 'undefined') {
          console.warn("ATTENTION: La console Lovable n'a pas été chargée correctement");
          console.log("Essayez de désactiver les bloqueurs de scripts, vider le cache du navigateur ou utiliser un autre navigateur");
        } else {
          console.log("Console Lovable détectée et chargée correctement");
        }
      }, 2000);
    }
  } catch (error) {
    logDebug("Erreur lors du rendu de l'application", error as Error);
    
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
          <h1>Erreur de chargement</h1>
          <p>L'application n'a pas pu être chargée correctement.</p>
          <p>Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}</p>
          <button onclick="window.location.reload()" style="padding:10px 20px; margin-top:20px; cursor:pointer;">
            Réessayer
          </button>
        </div>
      `;
    }
  }
}

// Gestionnaire d'erreurs global
window.addEventListener('error', (event) => {
  console.error('Erreur globale interceptée:', event.error);
  
  // Vérifier si l'erreur est liée à une ressource externe
  if (event.filename && (event.filename.includes('googleapis.com') || 
                         event.filename.includes('gpteng.co') || 
                         event.filename.includes('firestore'))) {
    console.warn(`Erreur de chargement de ressource externe: ${event.filename}`);
    console.log("Ce problème peut être lié à un bloqueur de scripts ou à un pare-feu");
  }
});

// Démarrer l'application quand le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Log initial pour confirmer le chargement du script
console.log("Script principal chargé avec succès");
