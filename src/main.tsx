
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Debug logging function
function logDebug(message: string) {
  console.log(`[FormaCert Debug] ${message}`);
}

// Initialize the application
function initializeApp() {
  logDebug("Initializing application");
  
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error("Root element not found");
    return;
  }
  
  try {
    logDebug("Creating React root");
    const root = createRoot(rootElement);
    
    logDebug("Rendering App component");
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    logDebug("App rendered successfully");
    
    // Log a message to confirm the app has loaded
    console.log("==== APPLICATION CHARGÉE AVEC SUCCÈS ====");
    console.log("Si vous voyez ce message mais que la console Lovable n'apparaît pas,");
    console.log("vérifiez que le script https://cdn.gpteng.co/gptengineer.js est bien chargé.");
  } catch (error) {
    console.error("Failed to render application:", error);
    
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
          <h1>Erreur de chargement</h1>
          <p>L'application n'a pas pu être chargée correctement.</p>
          <p>Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}</p>
          <button onclick="window.location.reload()">Réessayer</button>
        </div>
      `;
    }
  }
}

// Add global network error handler
window.addEventListener('error', (event) => {
  console.error('Erreur globale:', event.error);
});

// Check if script loading is being blocked
document.addEventListener('DOMContentLoaded', () => {
  const scriptElement = document.querySelector('script[src*="gptengineer.js"]');
  if (!scriptElement) {
    console.error("ALERTE: Le script Lovable (gptengineer.js) est manquant dans le DOM!");
  } else {
    console.log("Script Lovable trouvé dans le DOM:", scriptElement);
  }
  
  // Initialize after DOM is ready
  initializeApp();
});

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
