
// Fichier pont pour la compatibilité avec les scripts de diagnostic
// Ce fichier est utilisé comme point d'entrée pour l'application
console.log("Chargement de l'application FormaCert...");

// Import dynamique du fichier principal
try {
    // Recherche du script principal dans les assets
    const scripts = document.querySelectorAll('script[src*="main-"]');
    if (scripts.length > 0) {
        console.log("Script principal trouvé, utilisation directe");
    } else {
        console.log("Script principal non trouvé, tentative de chargement dynamique");
        
        // Tentative d'import dynamique
        import('./main.js')
            .then(() => console.log("Module ES6 principal chargé avec succès"))
            .catch(err => {
                console.error("Erreur de chargement du module principal", err);
                // Fallback pour les navigateurs qui ne prennent pas en charge les modules ES6
                const script = document.createElement('script');
                script.src = './main.js';
                script.type = 'text/javascript';
                document.head.appendChild(script);
            });
    }
} catch (e) {
    console.error("Erreur lors du chargement de l'application", e);
    
    // Message d'erreur visible pour l'utilisateur
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '10px';
    errorDiv.style.left = '10px';
    errorDiv.style.padding = '10px';
    errorDiv.style.background = '#fff3cd';
    errorDiv.style.color = '#856404';
    errorDiv.style.border = '1px solid #ffeeba';
    errorDiv.style.borderRadius = '4px';
    errorDiv.style.zIndex = '9999';
    errorDiv.innerText = "Erreur lors du chargement de l'application. Veuillez rafraîchir la page ou contacter l'administrateur.";
    document.body.appendChild(errorDiv);
}
