
console.log("Index.js: Chargement du script principal...");

// We'll use this script to load our application bundle
window.addEventListener('DOMContentLoaded', function() {
  // Make sure we have a root element
  if (!document.getElementById('root')) {
    const newRoot = document.createElement('div');
    newRoot.id = 'root';
    document.body.appendChild(newRoot);
  }
  
  // Dynamically load the built JS file (not the TSX directly)
  const script = document.createElement('script');
  script.type = 'module';
  script.src = '/src/main.js';
  script.onerror = function(error) {
    console.error('Error loading main script:', error);
    document.getElementById('root').innerHTML = `
      <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
        <h1>Erreur de chargement</h1>
        <p>L'application n'a pas pu démarrer correctement.</p>
        <button onclick="window.location.reload()">Réessayer</button>
      </div>
    `;
  };
  document.body.appendChild(script);
});

// Gestionnaire d'erreurs global simplifié
window.addEventListener('error', function(event) {
  console.error('Erreur détectée:', event.error);
});
