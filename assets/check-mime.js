
// Script de vérification des types MIME strictement compatible
"use strict";

// Log simple pour confirmer le chargement
console.log('MIME type check passed successfully!');

// Fonction de vérification accessible globalement
window.checkMimeTypeStatus = function() {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    message: 'JavaScript MIME type verification successful'
  };
};

// Version exportable pour modules
function checkMimeTypeLoading() {
  console.log('JavaScript MIME type verification successful');
  return true;
}

// Rendre la fonction disponible à la fois comme module et comme script standard
if (typeof window !== 'undefined') {
  window.checkMimeTypeLoading = checkMimeTypeLoading;
}

// Export conditionnel pour éviter les erreurs dans un contexte non-module
try {
  if (typeof exports !== 'undefined') {
    exports.checkMimeTypeLoading = checkMimeTypeLoading;
  }
} catch (e) {
  console.log('Mode non-module détecté');
}

// Export ES module seulement si supporté par l'environnement
try {
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = { checkMimeTypeLoading };
  }
} catch (e) {
  console.log('Export ES module non supporté dans ce contexte');
}
