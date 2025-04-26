
// Point d'entrée dynamique qui charge le fichier JavaScript principal
// Ce fichier est spécialement conçu pour fonctionner sur Infomaniak

// Fonction pour charger dynamiquement le script principal
function loadMainScript() {
    // Détection du fichier principal basé sur un pattern de nommage Vite
    const mainScriptPattern = /main-[a-zA-Z0-9]+\.js$/;
    const scripts = document.querySelectorAll('script[src]');
    let mainScriptFound = false;
    
    // Chercher d'abord dans les scripts déjà inclus dans la page
    for (const script of scripts) {
        const src = script.getAttribute('src');
        if (src && mainScriptPattern.test(src)) {
            console.log(`Script principal déjà chargé : ${src}`);
            mainScriptFound = true;
            break;
        }
    }
    
    // Si le script principal n'est pas trouvé, charger le fichier main.js directement
    if (!mainScriptFound) {
        try {
            // Pour l'environnement de production sur Infomaniak
            const mainScript = document.createElement('script');
            mainScript.type = 'module';
            mainScript.src = '/src/main.js';
            document.head.appendChild(mainScript);
            console.log('Chargement de main.js en tant que fallback');
        } catch (error) {
            console.error('Erreur lors du chargement du script principal:', error);
            
            // Dernier recours: charger le script de diagnostic si disponible
            try {
                import('./main-CJp6prML.js')
                    .then(() => console.log('Script de diagnostic chargé avec succès'))
                    .catch(err => console.error('Échec du chargement du script de diagnostic:', err));
            } catch (fallbackError) {
                console.error('Échec complet du chargement:', fallbackError);
            }
        }
    }
}

// Charger le script principal une fois le DOM chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadMainScript);
} else {
    loadMainScript();
}
