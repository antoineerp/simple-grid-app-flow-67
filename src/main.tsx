
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById("root");

if (rootElement) {
  try {
    console.log("React initialization started");
    // Ajout d'un gestionnaire d'erreurs global pour React
    window.addEventListener('error', (event) => {
      console.error('Global error caught:', event.error);
    });
    
    // Plus de logs pour suivre l'initialisation
    console.log("Creating React root element");
    const root = createRoot(rootElement);
    
    console.log("Starting React rendering");
    root.render(<App />);
    
    console.log("React rendering complete");
  } catch (error) {
    console.error("Failed to render React application:", error);
    
    // Fallback pour afficher une erreur à l'utilisateur
    rootElement.innerHTML = `
      <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
        <h1>Erreur de chargement</h1>
        <p>L'application n'a pas pu être chargée correctement.</p>
        <p>Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}</p>
        <button onclick="window.location.reload()">Réessayer</button>
      </div>
    `;
  }
} else {
  console.error("Root element not found");
  document.body.innerHTML = `
    <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
      <h1>Erreur critique</h1>
      <p>L'élément racine de l'application est introuvable.</p>
      <button onclick="window.location.reload()">Réessayer</button>
    </div>
  `;
}
