
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Fonction pour vérifier si le navigateur est compatible
function isBrowserCompatible() {
  const isLocalStorageAvailable = () => {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch (e) {
      return false;
    }
  };

  // Vérifier les fonctionnalités modernes requises
  return (
    typeof Promise !== 'undefined' &&
    typeof Array.prototype.find !== 'undefined' &&
    typeof Object.assign !== 'undefined' &&
    isLocalStorageAvailable()
  );
}

const rootElement = document.getElementById("root");

if (rootElement) {
  try {
    // Vérifier la compatibilité du navigateur
    if (!isBrowserCompatible()) {
      rootElement.innerHTML = `
        <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
          <h1>Navigateur non supporté</h1>
          <p>Votre navigateur ne semble pas compatible avec les fonctionnalités requises.</p>
          <p>Veuillez utiliser un navigateur récent comme Chrome, Firefox, Edge ou Safari.</p>
        </div>
      `;
    } else {
      console.log("Initialisation de l'application React");
      const root = createRoot(rootElement);
      root.render(<App />);
      
      console.log("Application rendering successfully started");
    }
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
