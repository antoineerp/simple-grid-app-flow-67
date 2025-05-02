
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log("Application starting from main.tsx...");
console.log("React version:", React.version);
console.log("Environment:", import.meta.env.MODE);

try {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error("Root element not found! Cannot mount React application.");
    throw new Error("Root element not found");
  }
  
  console.log("Root element found, mounting React application");
  
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  // Indiquer que l'application est chargée
  window.appLoaded = true;
  console.log("App component mounted successfully");
} catch (error) {
  console.error("Failed to render React application:", error);
  
  // Afficher des informations détaillées sur l'erreur
  if (error instanceof Error) {
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  }
  
  // Tenter d'afficher un message d'erreur à l'utilisateur
  const rootEl = document.getElementById("root");
  if (rootEl) {
    rootEl.innerHTML = `
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
  console.error('Error details:', {
    message: event.error?.message,
    stack: event.error?.stack,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Déclarer le type global pour TypeScript
declare global {
  interface Window {
    appLoaded?: boolean;
    checkMimeTypeStatus?: () => any;
  }
}
