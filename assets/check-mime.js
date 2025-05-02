
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

// Exporter la fonction pour la tester
export { checkMimeTypeLoading };
