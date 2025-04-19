import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { checkRoutesConsistency } from './utils/routesDiagnostic';

// Initialize global properties
if (typeof window.__LOVABLE_EDITOR__ === 'undefined') {
  window.__LOVABLE_EDITOR__ = null;
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Erreur globale interceptée:', event.error);
  
  if (event.filename && (event.filename.includes('googleapis.com') || 
                        event.filename.includes('gpteng.co') || 
                        event.filename.includes('firestore'))) {
    console.warn(`Erreur de chargement de ressource externe: ${event.filename}`);
    console.log("Ce problème peut être lié à un bloqueur de scripts ou à un pare-feu");
  }
});

// Start the app when DOM is ready
function startApp() {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error("Élément racine introuvable");
    return;
  }
  
  try {
    // Initialize the app (simplified)
    console.log("Initialisation de l'application");
    
    // Check if we're in demo mode
    const isDemoMode = typeof window.__LOVABLE_EDITOR__ !== 'undefined' && window.__LOVABLE_EDITOR__ !== null;
    console.log(`Mode détecté: ${isDemoMode ? 'Démo Lovable' : 'Production'}`);
    
    console.log("Création du root React");
    const root = createRoot(rootElement);
    
    console.log("Rendu de l'application React");
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    // Vérification des routes après le rendu
    checkRoutesConsistency();
    
    console.log("Application rendue avec succès");
    console.log(`==== APPLICATION CHARGÉE AVEC SUCCÈS EN MODE ${isDemoMode ? 'DÉMO' : 'PRODUCTION'} ====`);
  } catch (error) {
    console.error("Erreur lors du rendu de l'application", error);
    
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

// Log initial pour confirmer le chargement du script
console.log("Script principal chargé avec succès");
