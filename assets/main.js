
// Fichier main.js qui sert de point d'entrée principal pour l'application
console.log("Fallback main.js loaded from assets directory");

// Variables et constantes
let appInitialized = false;
const MAX_RETRIES = 3;

// Fonction d'initialisation de l'application
async function initializeApp() {
  try {
    console.log("Initializing application from fallback main.js");
    
    // Vérification de l'existence de React
    if (window.React) {
      console.log("React loaded from CDN");
    } else {
      console.log("React not found, attempting to load from CDN");
      await loadReactFromCdn();
    }
    
    // Chargement du bundle principal
    try {
      const appModule = await import('./index.js');
      console.log("Main application bundle loaded successfully");
      if (appModule.default && typeof appModule.default === 'function') {
        console.log("Application component found");
      }
    } catch (error) {
      console.error("Failed to load main app bundle:", error);
      fallbackToStaticContent();
    }
    
  } catch (error) {
    console.error("Critical application initialization error:", error);
    fallbackToStaticContent();
  }
}

// Fonction pour charger React depuis un CDN si nécessaire
async function loadReactFromCdn() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = "https://unpkg.com/react@18/umd/react.production.min.js";
    script.onload = () => {
      const domScript = document.createElement('script');
      domScript.src = "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js";
      domScript.onload = resolve;
      domScript.onerror = reject;
      document.body.appendChild(domScript);
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

// Fonction de repli pour afficher un contenu statique en cas d'échec
function fallbackToStaticContent() {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="text-align:center; font-family:sans-serif; max-width:800px; margin:0 auto; padding:2rem;">
        <h1>Qualite.cloud - Système de Management de la Qualité</h1>
        <p>L'application n'a pas pu être chargée correctement.</p>
        <div style="margin: 2rem 0; padding: 1rem; background:#f8f9fa; border-radius:8px;">
          <h2>Système de conformité ISO 27001</h2>
          <p>Notre plateforme vous aide à gérer efficacement vos processus qualité et sécurité.</p>
        </div>
        <button onclick="window.location.reload()" style="background:#0056b3; color:white; border:none; padding:0.75rem 1.5rem; border-radius:4px; cursor:pointer;">
          Actualiser la page
        </button>
      </div>
    `;
  }
}

// Lancement de l'initialisation
document.addEventListener('DOMContentLoaded', initializeApp);

// Écouteur global pour les erreurs
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  if (!appInitialized) {
    fallbackToStaticContent();
  }
});

// Exportation pour utilisation par d'autres modules
export default {
  initialize: initializeApp,
  version: '1.0.0'
};
