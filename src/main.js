
// Main entry point for the application
// This file provides a fallback for browsers that might have issues with direct ES imports
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Fonction auto-exécutante pour éviter la pollution du scope global
(function() {
  window.addEventListener('DOMContentLoaded', () => {
    try {
      console.log("Application initialization started");
      const rootElement = document.getElementById("root");
      
      if (rootElement) {
        console.log("Root element found, starting React rendering");
        const root = createRoot(rootElement);
        root.render(React.createElement(App));
        
        console.log("Application rendering successfully started");
      } else {
        console.error("Root element not found");
        document.body.innerHTML = `
          <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
            <h1>Erreur critique</h1>
            <p>L'élément racine de l'application est introuvable.</p>
            <button onclick="window.location.reload()">Réessayer</button>
          </div>
        `;
      }
    } catch (error) {
      console.error("Failed to render React application:", error);
      
      // Afficher des informations détaillées sur l'erreur
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Fallback pour afficher une erreur à l'utilisateur
      if (document.getElementById("root")) {
        document.getElementById("root").innerHTML = `
          <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
            <h1>Erreur de chargement</h1>
            <p>L'application n'a pas pu être chargée correctement.</p>
            <p>Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}</p>
            <button onclick="window.location.reload()">Réessayer</button>
          </div>
        `;
      }
    }
  });
})();

// Export vide pour compatibilité module
export default {};
