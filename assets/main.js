
// Fallback pour les navigateurs qui ne supportent pas les modules ES6
console.log('Chargement du script fallback (main.js) pour les navigateurs sans support ES6');

document.addEventListener('DOMContentLoaded', function() {
  try {
    // Vérification moins stricte - on va essayer de charger le script module même si React n'est pas disponible
    console.log('Tentative de démarrage de l\'application en mode fallback');
    
    // Essayer de charger le script principal
    var script = document.createElement('script');
    script.type = 'module';
    script.src = '/assets/index.js';
    script.onerror = function(error) {
      console.error('Erreur lors du chargement du script principal:', error);
      afficherMessageErreur('Erreur lors du chargement du script principal');
    };
    document.head.appendChild(script);
    
    // Si après 3 secondes l'application n'a pas démarré, afficher un message
    setTimeout(function() {
      if (document.getElementById('root').children.length <= 1) {
        afficherMessageErreur('L\'application n\'a pas pu démarrer correctement');
      }
    }, 3000);
  } catch (error) {
    console.error('Erreur lors du chargement du fallback:', error);
    afficherMessageErreur(error.message || 'Une erreur est survenue lors du chargement de l\'application');
  }
  
  function afficherMessageErreur(message) {
    document.getElementById('root').innerHTML = `
      <div style="text-align:center; padding:2rem;">
        <h1>FormaCert - Qualité.cloud</h1>
        <p>${message}</p>
        <p>Veuillez utiliser un navigateur moderne ou contacter le support.</p>
        <button onclick="window.location.reload()" style="padding:10px 15px; margin-top:20px; cursor:pointer;">
          Réessayer
        </button>
      </div>
    `;
  }
});
