
// Main entry point for the application - ES5 compatible version
console.log('Version de secours (ES5) de l\'application - DÉSACTIVÉE');

document.addEventListener('DOMContentLoaded', function() {
  try {
    const rootElement = document.getElementById('root');
    
    if (!rootElement) {
      throw new Error("Element racine non trouvé");
    }
    
    // Afficher un message d'erreur clair indiquant la nécessité d'une connexion réelle
    rootElement.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; padding: 2rem; text-align: center; font-family: system-ui, sans-serif; border: 2px solid #f44336; border-radius: 8px;">
        <img src="/public/lovable-uploads/formacert-logo.png" alt="FormaCert" style="max-width: 200px; margin-bottom: 20px;" />
        <h1 style="color: #f44336;">Connexion nécessaire</h1>
        <p style="font-size: 1.2rem;">Le mode de secours est désactivé conformément à votre demande.</p>
        <p>L'application nécessite une connexion à la base de données pour fonctionner.</p>
        <p>Vérifiez votre connexion internet et les paramètres d'accès à la base de données.</p>
        <button onclick="window.location.reload()" style="background: #0057b7; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; margin-top: 20px; font-size: 1rem;">
          Réessayer
        </button>
      </div>
    `;
    
    // Ne pas essayer de charger le script React manuellement comme fallback
    console.error("Mode de secours désactivé - connexion à la base de données requise");
    
  } catch (error) {
    console.error("Erreur lors du chargement de l'application:", error);
    
    if (document.getElementById('root')) {
      document.getElementById('root').innerHTML = `
        <div style="max-width: 600px; margin: 2rem auto; padding: 1rem; text-align: center; font-family: system-ui, sans-serif; border: 2px solid #f44336; border-radius: 8px;">
          <h1 style="color: #f44336;">Erreur de chargement</h1>
          <p>L'application n'a pas pu être chargée correctement.</p>
          <p>${error instanceof Error ? error.message : 'Erreur inconnue'}</p>
          <p style="font-weight: bold;">Le mode secours est désactivé - vraies données requises.</p>
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
      <div style="max-width: 600px; margin: 2rem auto; padding: 1rem; text-align: center; font-family: system-ui, sans-serif; border: 2px solid #f44336; border-radius: 8px;">
        <h1 style="color: #f44336;">Erreur d'exécution</h1>
        <p>Une erreur est survenue lors de l'exécution de l'application.</p>
        <p style="color: red; font-size: 0.9rem;">
          ${event.error?.message || 'Erreur non spécifiée'}
        </p>
        <p style="font-weight: bold;">Mode secours désactivé - vraies données requises.</p>
        <button onclick="window.location.reload()" 
                style="padding: 0.5rem 1rem; background: #0057b7; color: white; 
                       border: none; border-radius: 0.25rem; cursor: pointer; margin-top: 1rem;">
          Réessayer
        </button>
      </div>
    `;
  }
});
