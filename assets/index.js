
// Fichier JavaScript principal pour Infomaniak - format compatible
"use strict";

// Éviter les exports qui peuvent causer des problèmes sur certains serveurs
(function() {
  // Log simple pour confirmer le chargement
  console.log('Scripts chargés avec succès');
  
  // Fonction globale pour vérification 
  window.indexJsLoaded = function() {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      message: 'JavaScript chargé correctement'
    };
  };
  
  // Initialisation au chargement du document
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Document entièrement chargé et prêt');
    
    // Vérifier si l'élément root existe pour React
    if (document.getElementById('root')) {
      console.log('Élément racine React trouvé');
    }
  });
})();
