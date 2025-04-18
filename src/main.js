
// Main entry point for the application
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Fonction de journalisation personnalisée
function log(message) {
  console.log("FormaCert:", message);
}

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

  return (
    typeof Promise !== 'undefined' &&
    typeof Array.prototype.find !== 'undefined' &&
    typeof Object.assign !== 'undefined' &&
    isLocalStorageAvailable()
  );
}

// Point d'entrée principal de l'application
document.addEventListener('DOMContentLoaded', () => {
  log("Application en cours de chargement...");
  
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error("Élément 'root' introuvable dans le DOM");
    return;
  }
  
  log("Élément 'root' trouvé, rendu de l'application en cours...");
  
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
      return;
    }
    
    // Compter les feuilles de style chargées
    const styleSheets = document.styleSheets.length;
    log(`Style sheets loaded: ${styleSheets}`);
    
    // Tester la connexion à l'API
    const testApi = async () => {
      try {
        log("Tentative de connexion à l'API: /api/test.php");
        const cacheBuster = new Date().getTime();
        const response = await fetch(`/api/test.php?_=${cacheBuster}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        });
        
        log(`Statut de réponse API: ${response.status}`);
        
        const text = await response.text();
        log(`Contenu de réponse (premiers 100 caractères): \n${text.substring(0, 100)}`);
        
        try {
          const data = JSON.parse(text);
          if (response.ok && data && data.status === 200) {
            log("API joignable");
          } else {
            log(`API joignable mais renvoie une erreur: ${data?.message || 'Erreur inconnue'}`);
          }
        } catch (jsonError) {
          log(`Erreur d'analyse JSON: ${jsonError.message}`);
          log(`Contenu non-JSON reçu: ${text.substring(0, 100)}`);
        }
      } catch (error) {
        log(`Erreur lors de la vérification de l'API: ${error.message}`);
      }
    };
    
    // Tester l'API avant le rendu de l'application
    testApi().then(() => {
      // Rendre l'application React
      const root = createRoot(rootElement);
      root.render(React.createElement(App));
      log("Application rendue avec succès");
    });
    
  } catch (error) {
    console.error("Erreur lors du rendu de l'application:", error);
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

// Tests supplémentaires pour API
window.testApiDetails = async () => {
  try {
    log("Test de connexion à l'API: /api/test.php");
    const response = await fetch('/api/test.php', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    log(`Statut de la réponse: ${response.status}`);
    log(`Headers: ${JSON.stringify(Array.from(response.headers.entries()))}`);
    
    const text = await response.text();
    log(`Contenu brut de la réponse: \n${text}`);
    
  } catch (error) {
    log(`Erreur détaillée lors du test de l'API: ${error.message}`);
  }
};

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Erreur globale:', event.error);
});
