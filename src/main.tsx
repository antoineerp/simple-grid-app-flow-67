
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

try {
  console.log("Application starting...");
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error("Root element not found!");
    document.body.innerHTML = '<div style="text-align:center; padding:20px;"><h1>Erreur</h1><p>L\'élément racine est introuvable.</p></div>';
  } else {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    console.log("Application mounted successfully");
  }
} catch (error) {
  console.error("Failed to render application:", error);
  const message = error instanceof Error ? error.message : 'Erreur inconnue';
  document.body.innerHTML = `<div style="text-align:center; padding:20px;"><h1>Erreur</h1><p>${message}</p></div>`;
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});
