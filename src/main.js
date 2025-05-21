
// Main entry point for the application
// This file provides a fallback for browsers that might have issues with direct ES imports
(function() {
  try {
    console.log("Application initialization started");
    window.addEventListener('DOMContentLoaded', function() {
      var rootElement = document.getElementById("root");
      
      if (rootElement) {
        console.log("Root element found, starting React rendering");
        
        // Vérifier si React est disponible
        if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') {
          // Essayer de rendre l'application si React est chargé
          try {
            var App = require('./App.tsx').default;
            ReactDOM.createRoot(rootElement).render(React.createElement(App, null));
            console.log("Application rendering successfully started");
          } catch (e) {
            console.error("Error loading App component:", e);
            
            // Fallback pour afficher une erreur à l'utilisateur
            rootElement.innerHTML = `
              <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
                <h1>Erreur de chargement</h1>
                <p>Le composant App n'a pas pu être chargé.</p>
                <p>Erreur: ${e.message}</p>
                <button onclick="window.location.reload()">Réessayer</button>
              </div>
            `;
          }
        } else {
          console.error("React or ReactDOM not available");
          
          // Fallback si React n'est pas disponible
          rootElement.innerHTML = `
            <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
              <h1>Erreur de chargement</h1>
              <p>React n'a pas pu être chargé correctement.</p>
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
    });
  } catch (error) {
    console.error("Failed to initialize application:", error);
    
    // Afficher des informations détaillées sur l'erreur
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  }
  
  // Global error handler
  window.addEventListener('error', function(event) {
    console.error('Global error caught:', event.error);
    console.error('Error details:', {
      message: event.error?.message,
      stack: event.error?.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
})();
