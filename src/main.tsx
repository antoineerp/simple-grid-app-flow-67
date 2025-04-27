
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log("main.tsx: Initialisation de l'application React (version TSX)");

try {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error("Élément racine introuvable");
    const newRootElement = document.createElement("div");
    newRootElement.id = "root";
    document.body.appendChild(newRootElement);
    console.log("Nouvel élément racine créé");
    
    const root = createRoot(newRootElement);
    root.render(<App />);
    window.ReactDOMRoot = true;
  } else {
    console.log("Élément racine trouvé, démarrage du rendu React");
    const root = createRoot(rootElement);
    root.render(<App />);
    window.ReactDOMRoot = true;
    console.log("Rendu React démarré avec succès");
  }
} catch (error) {
  console.error("Erreur lors du rendu de l'application React:", error);
  
  // Utiliser une approche sans JSX en cas d'erreur
  try {
    const rootElement = document.getElementById("root") || document.body;
    const ReactDOM = require('react-dom/client');
    const React = require('react');
    const App = require('./App.tsx').default;
    
    ReactDOM.createRoot(rootElement).render(React.createElement(App));
  } catch (fallbackError) {
    console.error("Échec du fallback:", fallbackError);
    
    const rootElement = document.getElementById("root") || document.body;
    rootElement.innerHTML = `
      <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
        <h1>Erreur de chargement</h1>
        <p>L'application n'a pas pu être chargée correctement.</p>
        <button onclick="window.location.reload()">Réessayer</button>
      </div>
    `;
  }
}
