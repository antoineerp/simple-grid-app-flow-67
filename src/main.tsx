
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log("Application starting...");
console.log("React version:", React.version);
console.log("Environment:", import.meta.env.MODE);

try {
  const rootElement = document.getElementById('root') as HTMLElement;
  
  if (!rootElement) {
    console.error("Root element not found! Cannot mount React application.");
    throw new Error("Root element not found");
  }
  
  console.log("Root element found, mounting React application");
  
  // Ajouter un retrait des éléments de chargement avant le rendu de React
  while (rootElement.firstChild) {
    rootElement.removeChild(rootElement.firstChild);
  }
  
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  
  console.log("App component mounted successfully");
} catch (error) {
  console.error("Failed to render React application:", error);
  console.error("Error details:", {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : 'No stack trace available'
  });
  
  // Afficher un message d'erreur convivial pour l'utilisateur
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="text-align:center; padding:2rem; font-family: system-ui, sans-serif;">
        <h1>Erreur de chargement</h1>
        <p>L'application n'a pas pu être chargée correctement.</p>
        <p style="color: red; font-size: 0.9rem;">
          ${error instanceof Error ? error.message : 'Erreur inconnue'}
        </p>
        <button onclick="window.location.reload()" 
                style="padding:10px 20px; background: #0057b7; color: white; 
                       border: none; border-radius: 4px; cursor: pointer; margin-top: 20px;">
          Réessayer
        </button>
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
  
  // Ne pas afficher d'erreur si l'événement est lié au chargement de ressources
  if (event.filename && (event.filename.includes('main.js') || event.filename.includes('.css'))) {
    console.warn('Resource loading error detected, might be handled by fallback');
    return;
  }
  
  // Afficher un message d'erreur pour les erreurs non gérées
  const rootElement = document.getElementById('root');
  // Ne remplacer le contenu que si l'application ne semble pas avoir démarré correctement
  if (rootElement && (!rootElement.querySelector('nav') && !rootElement.querySelector('header'))) {
    rootElement.innerHTML = `
      <div style="text-align:center; padding:2rem; font-family: system-ui, sans-serif;">
        <h1>Erreur inattendue</h1>
        <p>Une erreur s'est produite lors de l'exécution de l'application.</p>
        <p style="color: red; font-size: 0.9rem;">
          ${event.error?.message || 'Erreur non spécifiée'}
        </p>
        <button onclick="window.location.reload()" 
                style="padding:10px 20px; background: #0057b7; color: white; 
                       border: none; border-radius: 4px; cursor: pointer; margin-top: 20px;">
          Réessayer
        </button>
      </div>
    `;
  }
});

// Navigation logging
window.addEventListener('popstate', () => {
  console.log('Navigation occurred:', window.location.pathname);
});
