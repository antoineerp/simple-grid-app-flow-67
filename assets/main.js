
// Fallback pour les navigateurs qui ne supportent pas les modules ES6
console.log('Chargement du script fallback (main.js) pour les navigateurs sans support ES6');

document.addEventListener('DOMContentLoaded', function() {
  try {
    // Vérification minimale pour s'assurer que React est disponible
    if (!window.React) {
      throw new Error("La bibliothèque React n'est pas disponible");
    }
    
    console.log('Tentative de démarrage de l\'application en mode fallback');
    
    // Le démarrage réel serait géré par le code bundlé, ici on s'assure juste
    // qu'un message est affiché si l'application ne démarre pas
    setTimeout(function() {
      if (document.getElementById('root').children.length <= 1) {
        document.getElementById('root').innerHTML = `
          <div style="text-align:center; padding:2rem;">
            <h1>FormaCert - Qualité.cloud</h1>
            <p>L'application n'a pas pu démarrer correctement.</p>
            <p>Veuillez utiliser un navigateur moderne ou contacter le support.</p>
            <button onclick="window.location.reload()" style="padding:10px 15px; margin-top:20px; cursor:pointer;">
              Réessayer
            </button>
          </div>
        `;
      }
    }, 3000);
  } catch (error) {
    console.error('Erreur lors du chargement du fallback:', error);
    document.getElementById('root').innerHTML = `
      <div style="text-align:center; padding:2rem;">
        <h1>Erreur de chargement</h1>
        <p>${error.message || 'Une erreur est survenue lors du chargement de l\'application.'}</p>
        <button onclick="window.location.reload()" style="padding:10px 15px; margin-top:20px; cursor:pointer;">
          Réessayer
        </button>
      </div>
    `;
  }
});
