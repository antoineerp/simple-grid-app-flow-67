
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

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});
