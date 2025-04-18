
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Debug logging function
function logDebug(message: string) {
  console.log(`[FormaCert Debug] ${message}`);
}

// Run on DOM content loaded to ensure everything is ready
document.addEventListener('DOMContentLoaded', () => {
  logDebug("DOM fully loaded, initializing app");
  
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error("Root element not found - critical error");
    return;
  }
  
  try {
    // Initialize React app
    logDebug("Creating React root and rendering App");
    const root = createRoot(rootElement);
    root.render(<App />);
    logDebug("App rendered successfully");
  } catch (error) {
    console.error("Failed to render React application:", error);
    rootElement.innerHTML = `
      <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
        <h1>Erreur de chargement</h1>
        <p>L'application n'a pas pu être chargée correctement.</p>
        <p>Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}</p>
        <button onclick="window.location.reload()">Réessayer</button>
      </div>
    `;
  }
});

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});
