
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
  
  // Afficher une erreur visuelle
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
        <h1>Erreur de chargement</h1>
        <p>L'application n'a pas pu être chargée correctement.</p>
        <p style="color: #721c24;">Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}</p>
        <button onclick="window.location.reload()" style="background: #0066cc; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;">Réessayer</button>
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

// Navigation logging
window.addEventListener('popstate', () => {
  console.log('Navigation occurred:', window.location.pathname);
});
