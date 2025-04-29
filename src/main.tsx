
// Main entry point for the application
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Fonction pour initialiser l'application
const initApp = () => {
  try {
    console.log("Initialisation de l'application...");
    const rootElement = document.getElementById("root");
    
    if (rootElement) {
      console.log("Élément racine trouvé, démarrage du rendu React");
      const root = createRoot(rootElement);
      root.render(React.createElement(App));
      console.log("Application React démarrée avec succès");
    } else {
      console.error("Élément racine non trouvé dans le DOM");
    }
  } catch (error) {
    console.error("Erreur lors du démarrage de l'application:", error);
  }
};

// Démarrer l'application quand le DOM est chargé
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Exporter explicitement pour une compatibilité optimale
export { initApp };
