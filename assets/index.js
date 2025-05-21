
// Fichier pont pour la compatibilité avec les scripts de diagnostic
// Ce fichier ne contient aucune référence au localStorage
console.log("Chargement du pont de compatibilité...");
try {
    import('./main-CJp6prML.js')
        .then(() => console.log("Module ES6 chargé avec succès"))
        .catch(err => {
            console.error("Erreur de chargement du module ES6, chargement du fallback", err);
            // Fallback pour les navigateurs qui ne prennent pas en charge les modules ES6
            const script = document.createElement('script');
            script.src = './main-CJp6prML.js';
            script.type = 'text/javascript';
            document.head.appendChild(script);
        });
} catch (e) {
    console.error("Erreur lors de l'import dynamique, chargement du fallback", e);
    // Fallback pour les navigateurs qui ne prennent pas en charge les modules ES6
    const script = document.createElement('script');
    script.src = './main-CJp6prML.js';
    script.type = 'text/javascript';
    document.head.appendChild(script);
}
