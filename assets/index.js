
// Fichier pont pour résoudre les problèmes de synchronisation avec les assets
// Ce fichier est chargé directement par index.html et s'occupe de charger le bon script principal

console.log("Initialisation du chargement des assets...");

// Fonction pour détecter le bon fichier main.js à charger
function detectMainScript() {
    // Rechercher tous les scripts main-*.js dans le document
    const scripts = document.querySelectorAll('script');
    let mainScriptUrl = null;

    // Vérifier si un script main-*.js est déjà chargé
    scripts.forEach(script => {
        const src = script.getAttribute('src');
        if (src && (src.includes('main-') || src === '/assets/main.js')) {
            mainScriptUrl = src;
        }
    });

    if (mainScriptUrl) {
        console.log(`Script principal déjà chargé : ${mainScriptUrl}`);
        return null; // Pas besoin de charger un autre script
    }

    // Si aucun script n'est trouvé, rechercher dans le dossier assets
    return findMainScriptInAssets();
}

// Fonction pour trouver le script principal dans le dossier assets
function findMainScriptInAssets() {
    console.log("Recherche du script principal dans le dossier assets...");

    // Créer un élément de script pour charger dynamiquement le script principal
    return '/assets/main.js'; // Ceci sera utilisé comme fallback
}

// Fonction pour charger un script
function loadScript(url) {
    return new Promise((resolve, reject) => {
        if (!url) {
            console.log("Aucun script à charger");
            resolve();
            return;
        }

        console.log(`Chargement du script: ${url}`);
        
        const script = document.createElement('script');
        script.type = 'module';
        script.src = url;
        script.onload = () => {
            console.log(`Script chargé avec succès: ${url}`);
            resolve();
        };
        script.onerror = (error) => {
            console.error(`Erreur lors du chargement du script: ${url}`, error);
            reject(error);
        };
        document.body.appendChild(script);
    });
}

// Démarrer l'application
(async function() {
    try {
        console.log("Démarrage du chargement de l'application...");

        // Détecter et charger le script principal
        const mainScriptUrl = detectMainScript();
        if (mainScriptUrl) {
            await loadScript(mainScriptUrl);
        }

        console.log("Application initialisée avec succès!");
    } catch (error) {
        console.error("Erreur lors de l'initialisation de l'application:", error);
        
        // Afficher une erreur à l'utilisateur
        const rootElement = document.getElementById('root');
        if (rootElement) {
            rootElement.innerHTML = `
                <div style="text-align: center; padding: 2rem; font-family: sans-serif;">
                    <h1>Erreur de chargement</h1>
                    <p>L'application n'a pas pu être chargée correctement.</p>
                    <p>Erreur: ${error.message || 'Erreur inconnue'}</p>
                    <button onclick="window.location.reload()" style="padding: 0.5rem 1rem; background: #4a6cf7; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Réessayer
                    </button>
                </div>
            `;
        }
    }
})();
