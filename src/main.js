
// Main entry point for the application
// This file provides a fallback for browsers that might have issues with direct ES imports
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log("main.js: Initialisation de l'application React (version JS)");

try {
  const rootElement = document.getElementById("root");
  
  if (rootElement) {
    console.log("Élément racine trouvé, démarrage du rendu React");
    const root = createRoot(rootElement);
    root.render(React.createElement(App));
    console.log("Rendu React démarré avec succès");
  } else {
    console.error("Élément racine non trouvé");
    document.body.innerHTML = `
      <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
        <h1>Erreur critique</h1>
        <p>L'élément racine de l'application est introuvable.</p>
        <button onclick="window.location.reload()">Réessayer</button>
      </div>
    `;
  }
} catch (error) {
  console.error("Échec du rendu de l'application React:", error);
  
  // Afficher des informations détaillées sur l'erreur
  console.error("Détails de l'erreur:", {
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

// Gestionnaire d'erreurs global
window.addEventListener('error', (event) => {
  console.error('Erreur globale détectée:', event.error);
});
