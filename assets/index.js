
// Point d'entrée pour les assets
// Ce fichier sert de pont vers les scripts principaux de l'application
import React from '/node_modules/react/index.js';
import { createRoot } from '/node_modules/react-dom/client.js';
import App from '../src/App';
import '../src/index.css';

console.log("Chargement de l'application via assets/index.js");

window.addEventListener('DOMContentLoaded', () => {
  try {
    console.log("Initialisation de l'application");
    const rootElement = document.getElementById("root");
    
    if (rootElement) {
      console.log("Rendu de React sur l'élément racine");
      const root = createRoot(rootElement);
      root.render(React.createElement(App));
    } else {
      console.error("Élément racine introuvable");
      document.body.innerHTML = `
        <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
          <h1>Erreur critique</h1>
          <p>L'élément racine de l'application est introuvable.</p>
          <button onclick="window.location.reload()">Réessayer</button>
        </div>
      `;
    }
  } catch (error) {
    console.error("Erreur lors du chargement de l'application:", error);
    
    // Afficher un message d'erreur convivial
    if (document.getElementById("root")) {
      document.getElementById("root").innerHTML = `
        <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
          <h1>Erreur de chargement</h1>
          <p>L'application n'a pas pu être chargée correctement.</p>
          <p style="color:red;">Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}</p>
          <button onclick="window.location.reload()">Réessayer</button>
        </div>
      `;
    }
  }
});
