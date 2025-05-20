
// Fichier vendor.js pour les bibliothèques externes
console.log("Chargement des dépendances externes...");

// Ce fichier est un placeholder pour les bibliothèques externes
// Dans une application de production, il contiendrait les bibliothèques tierces

// Détection des problèmes de chargement courants
(function() {
    // Vérifier si React est chargé
    if (typeof React === 'undefined') {
        console.warn("Attention: React n'est pas correctement chargé");
    }
    
    // Vérifier si ReactDOM est chargé
    if (typeof ReactDOM === 'undefined') {
        console.warn("Attention: ReactDOM n'est pas correctement chargé");
    }
    
    // Fonction utilitaire pour vérifier les problèmes de CORS
    function checkCORSIssues() {
        const img = new Image();
        img.onerror = function() {
            console.warn("Possible problème de CORS détecté lors du chargement des ressources");
        };
        img.src = window.location.origin + "/lovable-uploads/formacert-logo.png";
    }
    
    // Exécuter les vérifications après un court délai
    setTimeout(checkCORSIssues, 1000);
    
    console.log("Vérification des dépendances terminée");
})();
