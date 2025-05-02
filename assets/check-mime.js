
// Script de vérification des types MIME strictement compatible
"use strict";

// Utiliser une fonction auto-exécutante compatible module
(function() {
  // Log simple pour confirmer le chargement
  console.log('MIME type check passed successfully!');

  // Fonction de vérification accessible globalement
  window.checkMimeTypeStatus = function() {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      message: 'JavaScript MIME type verification successful',
      environment: {
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        userAgent: navigator.userAgent
      },
      document: {
        readyState: document.readyState,
        contentType: document.contentType || 'non détecté'
      }
    };
  };

  // Vérifier si un script peut être chargé dynamiquement
  window.testScriptLoading = function(url, callback) {
    var script = document.createElement('script');
    script.src = url + '?' + new Date().getTime(); // Éviter la mise en cache
    script.onload = function() {
      callback({success: true, url: url});
    };
    script.onerror = function() {
      callback({success: false, url: url, error: 'Failed to load'});
    };
    document.head.appendChild(script);
  };
})();

// No export statement - removed for compatibility with direct script loading
