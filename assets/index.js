
// Point d'entrée dynamique qui charge le fichier JavaScript principal
// Supporte à la fois l'environnement de développement et de production

// Fonction pour charger dynamiquement le script principal
function loadMainScript() {
    // Détection du fichier principal basé sur un pattern de nommage Vite
    const mainScriptPattern = /main-[a-zA-Z0-9]+\.js$/;
    const scripts = document.querySelectorAll('script[src]');
    
    for (const script of scripts) {
        const src = script.getAttribute('src');
        if (src && mainScriptPattern.test(src)) {
            console.log(`Chargement du script principal : ${src}`);
            return;
        }
    }
    
    // Fallback pour le diagnostic
    import('./main-CJp6prML.js');
    console.warn('Chargement du script de diagnostic');
}

// Charger le script principal une fois le DOM chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadMainScript);
} else {
    loadMainScript();
}
