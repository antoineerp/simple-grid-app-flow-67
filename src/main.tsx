
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { initializeApp, handleInitError } from './utils/appInitializer';
import { logDebug } from './utils/logger';
import { getEnvironmentType, getEnvironmentName } from './utils/environment';

// Define window properties for TypeScript
declare global {
  interface Window {
    __LOVABLE_EDITOR__: any;
  }
}

// Initialize Lovable editor
window.__LOVABLE_EDITOR__ = window.__LOVABLE_EDITOR__ || null;

// Log environment info
console.log(`==== Application démarrée en mode: ${getEnvironmentName()} ====`);

// Start the application when DOM is ready
function startApp() {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    logDebug("Élément racine introuvable", new Error("Root element not found"));
    return;
  }
  
  try {
    // Initialize the application
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
    
  } catch (error) {
    handleInitError(error as Error, rootElement);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

// Log successful script load
console.log("Script principal chargé avec succès");
