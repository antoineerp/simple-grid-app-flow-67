
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log("main.tsx: Initialisation de l'application React (version TSX)");

const rootElement = document.getElementById("root");

if (rootElement) {
  try {
    console.log("React initialization started from TSX");
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log("React rendering complete from TSX");
  } catch (error) {
    console.error("Failed to render React application from TSX:", error);
    
    // Fallback simple sans JSX en cas d'erreur de transpilation
    try {
      // @ts-ignore - Utilisation intentionnelle de React.createElement
      const ReactDOM = require('react-dom/client');
      const React = require('react');
      ReactDOM.createRoot(rootElement).render(React.createElement(App));
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      // Utiliser document.createElement si tout échoue
      rootElement.innerHTML = `
        <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
          <h1>Erreur de chargement</h1>
          <p>L'application n'a pas pu être chargée correctement.</p>
          <button onclick="window.location.reload()">Réessayer</button>
        </div>
      `;
    }
  }
} else {
  console.error("Root element not found in TSX");
  document.body.innerHTML = `
    <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
      <h1>Erreur critique</h1>
      <p>L'élément racine de l'application est introuvable.</p>
      <button onclick="window.location.reload()">Réessayer</button>
    </div>
  `;
}
