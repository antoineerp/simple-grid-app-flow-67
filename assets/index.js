
console.log("Index.js: Chargement du script principal...");

// Point d'entrée simplifié qui ne fait que charger le script principal
document.addEventListener('DOMContentLoaded', function() {
  if (!document.getElementById('root')) {
    const newRoot = document.createElement('div');
    newRoot.id = 'root';
    document.body.appendChild(newRoot);
  }
});

// Gestionnaire d'erreurs global simplifié
window.addEventListener('error', function(event) {
  console.error('Erreur détectée:', event.error);
});
