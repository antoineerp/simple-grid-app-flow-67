
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { initializeApp, handleInitError } from './utils/appInitializer';
import { logDebug } from './utils/logger';
import { isLovableDemo } from './utils/environment';

// Define window properties for TypeScript
declare global {
  interface Window {
    __LOVABLE_EDITOR__: any;
    __diagnoseLovable: () => void;
    testPhp: () => void;
  }
}

// Initialize global properties
window.__LOVABLE_EDITOR__ = window.__LOVABLE_EDITOR__ || null;

// Gestionnaire d'erreurs global
window.addEventListener('error', (event) => {
  console.error('Erreur globale interceptée:', event.error);
  
  if (event.filename && (event.filename.includes('googleapis.com') || 
                        event.filename.includes('gpteng.co') || 
                        event.filename.includes('firestore'))) {
    console.warn(`Erreur de chargement de ressource externe: ${event.filename}`);
    console.log("Ce problème peut être lié à un bloqueur de scripts ou à un pare-feu");
  }
});

// Démarrer l'application quand le DOM est prêt
function startApp() {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    logDebug("Élément racine introuvable", new Error("Root element not found"));
    return;
  }
  
  try {
    // Initialiser l'application
    initializeApp();
    
    logDebug("Création du root React");
    const root = createRoot(rootElement);
    
    logDebug("Rendu de l'application React");
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    logDebug("Application rendue avec succès");
    console.log(`==== APPLICATION CHARGÉE AVEC SUCCÈS EN MODE ${isLovableDemo() ? 'DÉMO' : 'PRODUCTION'} ====`);
    
    // Vérification supplémentaire pour la console Lovable en mode démo
    if (isLovableDemo()) {
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
    handleInitError(error as Error, rootElement);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

// Log initial pour confirmer le chargement du script
console.log("Script principal chargé avec succès");
