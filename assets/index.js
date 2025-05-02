
// Fichier JavaScript principal pour Infomaniak - format compatible
"use strict";

// Éviter les exports qui peuvent causer des problèmes sur certains serveurs
(function() {
  // Log simple pour confirmer le chargement
  console.log('Scripts chargés avec succès - Infomaniak compatible');
  
  // Fonction globale pour vérification 
  window.indexJsLoaded = function() {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      message: 'JavaScript chargé correctement',
      host: window.location.hostname
    };
  };
  
  // Vérifier s'il y a des problèmes de chargement sur cette page
  window.checkLoadingStatus = function() {
    var status = {
      pageReady: document.readyState,
      rootElement: document.getElementById('root') ? true : false,
      scripts: {
        total: document.scripts.length,
        loaded: Array.from(document.scripts).filter(function(script) {
          return script.src && !script.async;
        }).length
      }
    };
    return status;
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
