
// Fichier pont pour la compatibilité avec les scripts de diagnostic
// Ce fichier est utilisé comme point d'entrée pour l'application
console.log("Chargement de l'application FormaCert...");

// Fonction pour détecter le fichier main.js actuel
function detectMainScript() {
    const scripts = document.querySelectorAll('script[src*="main-"]');
    if (scripts.length > 0) {
        console.log("Script principal détecté:", scripts[0].getAttribute('src'));
        return true;
    }
    return false;
}

// Fonction pour charger dynamiquement un script
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.type = 'module';
        script.onload = () => {
            console.log(`Script chargé avec succès: ${src}`);
            resolve();
        };
        script.onerror = (error) => {
            console.error(`Erreur de chargement du script: ${src}`, error);
            reject(error);
        };
        document.head.appendChild(script);
    });
}

// Essayer de détecter et charger le bon script
try {
    if (!detectMainScript()) {
        console.log("Script principal non trouvé, tentative de chargement dynamique");
        
        // Essayer de charger main.js ou tout autre script avec un hash dans le nom
        const scriptPaths = [
            './assets/main.js',
            './main.js',
            './assets/index.js'
        ];
        
        // Essayer chaque chemin un par un
        Promise.any(scriptPaths.map(path => loadScript(path)))
            .catch(error => {
                console.error("Tous les scripts ont échoué à charger", error);
                
                // Afficher une erreur visuelle pour l'utilisateur
                const errorMessage = document.createElement('div');
                errorMessage.style = `
                    position: fixed;
                    top: 10px;
                    left: 10px;
                    background-color: #f8d7da;
                    color: #721c24;
                    padding: 10px;
                    border-radius: 4px;
                    z-index: 9999;
                `;
                errorMessage.innerHTML = `
                    <strong>Erreur de chargement</strong>
                    <p>L'application n'a pas pu être chargée correctement.</p>
                    <button onclick="window.location.reload()">Rafraîchir</button>
                `;
                document.body.appendChild(errorMessage);
            });
    }
} catch (e) {
    console.error("Erreur lors du chargement de l'application", e);
}
