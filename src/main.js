
// Main entry point for the application - ES5 compatible version
console.log('Chargement de la version de secours (ES5) de l\'application');

document.addEventListener('DOMContentLoaded', function() {
  try {
    const rootElement = document.getElementById('root');
    
    if (!rootElement) {
      throw new Error("Element racine non trouvé");
    }
    
    // Nettoyer le contenu de chargement
    while (rootElement.firstChild) {
      rootElement.removeChild(rootElement.firstChild);
    }
    
    // Afficher un message de démarrage
    rootElement.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; padding: 2rem; text-align: center; font-family: system-ui, sans-serif;">
        <img src="/public/lovable-uploads/formacert-logo.png" alt="FormaCert" style="max-width: 200px; margin-bottom: 20px;" />
        <h1>FormaCert - Qualité.cloud</h1>
        <p>L'application est en cours de chargement en mode de compatibilité.</p>
        <p>Si rien ne se passe, veuillez utiliser un navigateur plus récent ou contacter le support technique.</p>
      </div>
    `;
    
    // Essayer de charger le script React manuellement
    const mainScript = document.createElement('script');
    mainScript.src = '/src/main.tsx';
    mainScript.type = 'module';
    mainScript.onerror = function() {
      console.error("Impossible de charger le script principal");
    };
    document.body.appendChild(mainScript);
    
  } catch (error) {
    console.error("Erreur lors du chargement de l'application:", error);
    
    if (document.getElementById('root')) {
      document.getElementById('root').innerHTML = `
        <div style="max-width: 600px; margin: 2rem auto; padding: 1rem; text-align: center; font-family: system-ui, sans-serif;">
          <h1>Erreur de chargement</h1>
          <p>L'application n'a pas pu être chargée correctement.</p>
          <p>${error instanceof Error ? error.message : 'Erreur inconnue'}</p>
          <button onclick="window.location.reload()" 
                  style="padding: 0.5rem 1rem; background: #0057b7; color: white; 
                         border: none; border-radius: 0.25rem; cursor: pointer; margin-top: 1rem;">
            Réessayer
          </button>
        </div>
      `;
    }
  }
});

// Global error handler
window.addEventListener('error', function(event) {
  console.error('Erreur globale détectée:', event.error);
  
  // Ne pas afficher d'erreur pour les ressources non chargées
  if (event.filename && (event.filename.includes('.css') || event.filename.includes('fonts/'))) {
    return;
  }
  
  const rootElement = document.getElementById('root');
  // Ne remplacer le contenu que si l'application ne semble pas avoir démarré
  if (rootElement && !rootElement.querySelector('nav') && !rootElement.querySelector('header')) {
    rootElement.innerHTML = `
      <div style="max-width: 600px; margin: 2rem auto; padding: 1rem; text-align: center; font-family: system-ui, sans-serif;">
        <h1>Erreur inattendue</h1>
        <p>Une erreur est survenue lors de l'exécution de l'application.</p>
        <p style="color: red; font-size: 0.9rem;">
          ${event.error?.message || 'Erreur non spécifiée'}
        </p>
        <button onclick="window.location.reload()" 
                style="padding: 0.5rem 1rem; background: #0057b7; color: white; 
                       border: none; border-radius: 0.25rem; cursor: pointer; margin-top: 1rem;">
          Réessayer
        </button>
      </div>
    `;
  }
});
