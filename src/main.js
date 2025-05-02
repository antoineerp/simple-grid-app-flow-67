
// Main entry point for the application - fallback for browsers with MIME issues
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log("Application starting from main.js fallback...");
console.log("Environment:", process.env.NODE_ENV);

try {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error("Root element not found! Cannot mount React application.");
    throw new Error("Root element not found");
  }
  
  console.log("Root element found, mounting React application");
  
  const root = createRoot(rootElement);
  root.render(
    React.createElement(React.StrictMode, null, 
      React.createElement(App)
    )
  );
  
  console.log("App component mounted successfully");
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

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});
