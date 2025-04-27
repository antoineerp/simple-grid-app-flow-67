
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log("Initialisation de l'application React");

try {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    throw new Error("Élément racine introuvable");
  }

  // Log available routes for debugging
  console.log("Routes disponibles:", [
    "/",
    "/pilotage",
    "/exigences",
    "/gestion-documentaire",
    "/ressources-humaines",
    "/collaboration",
    "/verification-routes",
    "/administration"
  ]);

  // Wait for DOM to be fully loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      const root = createRoot(rootElement);
      root.render(<App />);
      console.log("Application démarrée avec succès");
    });
  } else {
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log("Application démarrée avec succès");
  }
  
} catch (error) {
  console.error("Erreur lors du démarrage de l'application:", error);
  
  const rootElement = document.getElementById("root") || document.body;
  rootElement.innerHTML = `
    <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
      <h1>Erreur de chargement</h1>
      <p>L'application n'a pas pu démarrer correctement.</p>
      <button onclick="window.location.reload()">Réessayer</button>
    </div>
  `;
}
