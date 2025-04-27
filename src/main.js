
// Main entry point for the application
// This file provides a fallback for browsers that might have issues with direct ES imports
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log("main.js: Initialisation de l'application React (version JS)");

// Fonction pour trouver l'élément racine avec plusieurs tentatives
function findRootElement() {
  // Essayer d'abord l'ID standard
  let rootElement = document.getElementById("root");
  
  // Si l'élément racine n'est pas trouvé, chercher d'autres éléments possibles
  if (!rootElement) {
    console.log("Élément 'root' non trouvé, recherche d'alternatives...");
    rootElement = document.querySelector("[id='root']") || 
                  document.querySelector(".root") || 
                  document.querySelector("div[data-reactroot]");
    
    if (rootElement) {
      console.log("Élément racine alternatif trouvé:", rootElement);
    }
  }
  
  return rootElement;
}

// Wrapper pour gérer les erreurs de rendu React
function initReactApp() {
  try {
    const rootElement = findRootElement();
    
    if (rootElement) {
      console.log("Élément racine trouvé, démarrage du rendu React");
      try {
        const root = createRoot(rootElement);
        root.render(React.createElement(App));
        console.log("Rendu React démarré avec succès");
        // Marquer l'initialisation comme réussie
        window.ReactDOMRoot = true;
      } catch (renderError) {
        console.error("Échec du rendu React:", renderError);
        throw renderError;
      }
    } else {
      console.error("Élément racine non trouvé après plusieurs tentatives");
      // Créer un élément racine s'il n'existe pas
      const newRootElement = document.createElement("div");
      newRootElement.id = "root";
      document.body.appendChild(newRootElement);
      console.log("Nouvel élément racine créé, tentative de démarrage React");
      
      const root = createRoot(newRootElement);
      root.render(React.createElement(App));
      window.ReactDOMRoot = true;
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
    const rootElement = document.getElementById("root") || document.body;
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
    
    return false;
  }
  
  return true;
}

// Démarrer l'application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReactApp);
} else {
  initReactApp();
}

// Gestionnaire d'erreurs global
window.addEventListener('error', (event) => {
  console.error('Erreur globale détectée:', event.error);
});

// Assurer que le script est chargé correctement
console.log("main.js: Script chargé avec succès");
